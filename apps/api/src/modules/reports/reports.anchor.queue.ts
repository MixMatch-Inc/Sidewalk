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

  const report = await ReportModel.findById(reportId).select({
    _id: 1,
    stellar_tx_hash: 1,
    anchor_status: 1,
  });

  if (!report) {
    logger.warn('Anchor job skipped; report not found', { reportId });
    return;
  }

  if (report.stellar_tx_hash) {
    logger.info('Anchor job skipped; report already anchored', {
      reportId,
      txHash: report.stellar_tx_hash,
    });
    return;
  }

  await ReportModel.updateOne(
    { _id: reportId },
    {
      $inc: { anchor_attempts: 1 },
      $set: { anchor_status: 'PENDING_ANCHOR' },
    },
  );

  try {
    const txHash = await stellarService.anchorHash(dataHash);
    await ReportModel.updateOne(
      { _id: reportId },
      {
        $set: {
          stellar_tx_hash: txHash,
          anchor_status: 'ANCHORED',
          anchor_last_error: null,
        },
      },
    );

    logger.info('Report anchored successfully', { reportId, txHash });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await ReportModel.updateOne(
      { _id: reportId },
      {
        $set: {
          anchor_last_error: message,
          anchor_status:
            job.attemptsMade + 1 >= (job.opts.attempts ?? 1) ? 'FAILED' : 'PENDING_ANCHOR',
        },
      },
    );
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
      jobId: job?.id,
      reportId: job?.data?.reportId,
      attemptsMade: job?.attemptsMade,
      error: error.message,
    });
  });
};
