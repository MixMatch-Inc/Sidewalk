import { Queue, Worker, type Job } from 'bullmq';
import { logger } from '../../core/logging/logger';
import { compressAndReplaceImage } from './media.s3';
import { MediaUploadModel } from './media-upload.model';

export type MediaProcessingJob = {
  key: string;
  url: string;
};

const redisUrl = process.env.REDIS_URL;
const JOB_NAME = 'compress-image' as const;

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

export const mediaProcessingQueue = queueConnection
  ? new Queue<MediaProcessingJob, void, typeof JOB_NAME>('image-processing', {
      connection: queueConnection,
    })
  : null;

export const enqueueMediaProcessing = async (payload: MediaProcessingJob) => {
  const queueLogger = logger.child({
    queue: 'image-processing',
    key: payload.key,
  });
  if (!mediaProcessingQueue) {
    queueLogger.warn('Media queue unavailable (missing REDIS_URL); keeping original image');
    return;
  }

  try {
    await mediaProcessingQueue.add(JOB_NAME, payload, {
      removeOnComplete: 1000,
      removeOnFail: 1000,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    await MediaUploadModel.updateOne(
      { key: payload.key },
      {
        $set: {
          processing_status: 'QUEUED',
        },
      },
      { upsert: true },
    );
  } catch (error) {
    queueLogger.warn('Failed to enqueue media processing job; keeping original image', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

let worker: Worker<MediaProcessingJob, void, typeof JOB_NAME> | null = null;

export const startMediaProcessingWorker = () => {
  if (!redisUrl) {
    logger.warn('REDIS_URL not set; media processing worker is disabled');
    return;
  }

  if (worker) {
    return;
  }

  worker = new Worker<MediaProcessingJob, void, typeof JOB_NAME>(
    'image-processing',
    async (job: Job<MediaProcessingJob>) => {
      const { key, url } = job.data;
      const jobLogger = logger.child({
        queue: 'image-processing',
        jobId: String(job.id),
        key,
      });

      try {
        await MediaUploadModel.updateOne(
          { key },
          { $set: { processing_status: 'PROCESSING' } },
        );

        await compressAndReplaceImage(key);

        await MediaUploadModel.updateOne(
          { key },
          {
            $set: {
              processing_status: 'DONE',
              optimized_format: 'image/webp',
              optimized_url: url,
            },
          },
        );
      } catch (error) {
        await MediaUploadModel.updateOne(
          { key },
          {
            $set: {
              processing_status: 'FAILED',
              processing_error:
                error instanceof Error ? error.message : 'image_processing_failed',
            },
          },
        );

        jobLogger.error('Image processing job failed; original image retained', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    {
      connection: buildConnectionOptions(redisUrl),
      concurrency: 1,
    },
  );

  worker.on('failed', (job, error) => {
    logger.warn('Media worker job failed', {
      queue: 'image-processing',
      jobId: job?.id,
      key: job?.data?.key,
      error: error.message,
    });
  });
};
