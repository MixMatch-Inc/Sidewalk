import { randomUUID } from 'crypto';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import sharp from 'sharp';
import { AppError } from '../../core/errors/app-error';
import { getApiEnv, getS3Env } from '../../config/env';

const getS3ClientConfig = () => {
  const { S3_BUCKET, S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } =
    getS3Env();

  return {
    bucket: S3_BUCKET,
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  };
};

const getS3Client = () => {
  const { region, endpoint, accessKeyId, secretAccessKey } = getS3ClientConfig();

  return new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

const extensionForMime = (mime: string) => {
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '';
};

export const buildObjectUrl = (objectKey: string) => {
  const { S3_PUBLIC_BASE_URL, S3_BUCKET, S3_REGION, S3_ENDPOINT } = getApiEnv();
  if (S3_PUBLIC_BASE_URL) {
    return `${S3_PUBLIC_BASE_URL.replace(/\/+$/, '')}/${objectKey}`;
  }

  if (S3_ENDPOINT) {
    const normalized = S3_ENDPOINT.replace(/\/+$/, '');
    return `${normalized}/${S3_BUCKET}/${objectKey}`;
  }

  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${objectKey}`;
};

export const buildObjectKey = (mime: string) => {
  const ext = extensionForMime(mime);
  return `reports/${randomUUID()}${ext}`;
};

export const uploadStreamToS3 = async (
  body: Readable,
  mime: string,
  objectKey: string,
) => {
  const client = getS3Client();
  const { bucket } = getS3ClientConfig();
  const params: PutObjectCommandInput = {
    Bucket: bucket,
    Key: objectKey,
    Body: body,
    ContentType: mime,
  };

  const upload = new Upload({
    client,
    params,
  });

  await upload.done();

  return {
    key: objectKey,
    url: buildObjectUrl(objectKey),
  };
};

const toBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export const compressAndReplaceImage = async (objectKey: string): Promise<void> => {
  const client = getS3Client();
  const { bucket } = getS3ClientConfig();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );

  if (!response.Body) {
    throw new AppError('S3 object body missing during processing', 500, 'S3_PROCESSING_FAILED');
  }

  const originalBuffer = await toBuffer(response.Body as Readable);

  // Re-encoding to WebP strips EXIF metadata by default.
  const optimizedBuffer = await sharp(originalBuffer)
    .resize({
      width: 1920,
      height: 1080,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: optimizedBuffer,
      ContentType: 'image/webp',
    }),
  );
};

export const generatePresignedGetObjectUrl = async (
  objectKey: string,
  expiresInSeconds = 900,
): Promise<string> => {
  const client = getS3Client();
  const { bucket } = getS3ClientConfig();
  return getSignedUrl(
    client as never,
    new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }) as never,
    { expiresIn: expiresInSeconds },
  );
};

export type S3ListedObject = {
  key: string;
  lastModified: Date | null;
  url: string;
};

export const listAllReportObjects = async (): Promise<S3ListedObject[]> => {
  const client = getS3Client();
  const { bucket } = getS3ClientConfig();
  const results: S3ListedObject[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'reports/',
        ContinuationToken: continuationToken,
      }),
    );

    for (const item of response.Contents ?? []) {
      if (!item.Key) {
        continue;
      }

      results.push({
        key: item.Key,
        lastModified: item.LastModified ?? null,
        url: buildObjectUrl(item.Key),
      });
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return results;
};

export const deleteObjectFromS3 = async (objectKey: string): Promise<void> => {
  const client = getS3Client();
  const { bucket } = getS3ClientConfig();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );
};
