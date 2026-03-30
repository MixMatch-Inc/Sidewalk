import { Queue, Worker, type Job } from 'bullmq';
import { stellarService } from '../../config/stellar';
import { logger } from '../../core/logging/logger';
import { ReportModel } from './report.model';

const redisUrl = process.env.REDIS_URL;
const JOB_NAME = 'anchor-report' as const;
const QUEUE_NAME = 'stellar-anchor';

export type StellarAnchorJob = {
  reportId: string;
  dataHash: string;
};

const buildConnectionOptions = (url: string) => {
  const parsed = new URL(url);

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: parsed.pathname ? Number(parsed.pathname.replace('/', '') || '0') : 0,
    maxRetriesPerRequest: null as null,
  };
};

const queueConnection = redisUrl ? buildConnectionOptions(redisUrl) : null;

const stellarAnchorQueue = queueConnection
  ? new Queue<StellarAnchorJob, void, typeof JOB_NAME>(QUEUE_NAME, {
      connection: queueConnection,
    })
  : null;

export const enqueueStellarAnchor = async (payload: StellarAnchorJob): Promise<void> => {
  if (!stellarAnchorQueue) {
    logger.warn('Stellar anchor queue unavailable (missing REDIS_URL)', {
      reportId: payload.reportId,
    });
    return;
  }

  await stellarAnchorQueue.add(JOB_NAME, payload, {
    jobId: `anchor-report:${payload.reportId}`,
    removeOnComplete: 1000,
    removeOnFail: 1000,
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 3_000,
    },
  });
};

let worker: Worker<StellarAnchorJob, void, typeof JOB_NAME> | null = null;

const processAnchorJob = async (job: Job<StellarAnchorJob>): Promise<void> => {
  const { reportId, dataHash } = job.data;
  const jobLogger = logger.child({
    queue: QUEUE_NAME,
    jobId: String(job.id),
    reportId,
  });

  const report = await ReportModel.findById(reportId).select({
    _id: 1,
    stellar_tx_hash: 1,
    anchor_status: 1,
    data_hash: 1,
  });

  if (!report) {
    jobLogger.warn('Anchor job skipped; report not found');
    return;
  }

  if (
    report.stellar_tx_hash ||
    report.anchor_status === 'ANCHOR_SUCCESS'
  ) {
    jobLogger.info('Anchor job skipped; report already anchored', {
      txHash: report.stellar_tx_hash,
    });
    return;
  }

  if (report.anchor_status === 'ANCHOR_FAILED') {
    jobLogger.warn('Anchor job skipped; report already marked permanently failed');
    return;
  }

  await ReportModel.updateOne(
    { _id: reportId },
    {
      $inc: { anchor_attempts: 1 },
      $set: {
        anchor_status: 'ANCHOR_QUEUED',
        anchor_needs_attention: false,
        anchor_failed_at: null,
      },
    },
  );

  try {
    const anchorHash = report.data_hash || dataHash;
    const txHash = await stellarService.anchorHash(anchorHash);
    await ReportModel.updateOne(
      { _id: reportId },
      {
        $set: {
          stellar_tx_hash: txHash,
          anchor_status: 'ANCHOR_SUCCESS',
          anchor_last_error: null,
          anchor_needs_attention: false,
          anchor_failed_at: null,
        },
      },
    );

    jobLogger.info('Report anchored successfully', { txHash });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isFinalFailure = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
    await ReportModel.updateOne(
      { _id: reportId },
      {
        $set: {
          anchor_last_error: message,
          anchor_status: isFinalFailure ? 'ANCHOR_FAILED' : 'ANCHOR_QUEUED',
          anchor_needs_attention: isFinalFailure,
          anchor_failed_at: isFinalFailure ? new Date() : null,
        },
      },
    );

    if (isFinalFailure) {
      jobLogger.error('Anchor job exhausted retries; compensating state applied', {
        anchorStatus: 'ANCHOR_FAILED',
        dashboardAlert: true,
        reason: message,
      });
    }
    throw error;
  }
};

export const startStellarAnchorWorker = () => {
  if (!redisUrl) {
    logger.warn('REDIS_URL not set; stellar anchor worker is disabled');
    return;
  }

  if (worker) {
    return;
  }

  worker = new Worker<StellarAnchorJob, void, typeof JOB_NAME>(
    QUEUE_NAME,
    processAnchorJob,
    {
      connection: buildConnectionOptions(redisUrl),
      concurrency: 1,
    },
  );

  worker.on('failed', (job, error) => {
    logger.warn('Stellar anchor job failed', {
      queue: QUEUE_NAME,
      jobId: job?.id,
      reportId: job?.data?.reportId,
      attemptsMade: job?.attemptsMade,
      error: error.message,
    });
  });
};
