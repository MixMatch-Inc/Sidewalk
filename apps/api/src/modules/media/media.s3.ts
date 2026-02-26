import { randomUUID } from 'crypto';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import sharp from 'sharp';
import { AppError } from '../../core/errors/app-error';

const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION ?? 'us-east-1';
const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

if (!bucket) {
  throw new AppError('Missing S3_BUCKET environment variable', 500, 'S3_CONFIG_MISSING');
}

if (!accessKeyId || !secretAccessKey) {
  throw new AppError(
    'Missing S3_ACCESS_KEY_ID or S3_SECRET_ACCESS_KEY environment variable',
    500,
    'S3_CONFIG_MISSING',
  );
}

const client = new S3Client({
  region,
  ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const extensionForMime = (mime: string) => {
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '';
};

const buildObjectUrl = (objectKey: string) => {
  const publicBase = process.env.S3_PUBLIC_BASE_URL;
  if (publicBase) {
    return `${publicBase.replace(/\/+$/, '')}/${objectKey}`;
  }

  if (endpoint) {
    const normalized = endpoint.replace(/\/+$/, '');
    return `${normalized}/${bucket}/${objectKey}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;
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
  return getSignedUrl(
    client as never,
    new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }) as never,
    { expiresIn: expiresInSeconds },
  );
};
