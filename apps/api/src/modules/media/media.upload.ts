import { PassThrough, Transform, TransformCallback } from 'stream';
import Busboy from 'busboy';
import { NextFunction, Request, Response } from 'express';
import * as exifr from 'exifr';
import { AppError } from '../../core/errors/app-error';
import { buildObjectKey, uploadStreamToS3 } from './media.s3';
import { MediaDraftModel } from './media-draft.model';
import { MediaUploadModel } from './media-upload.model';
import { enqueueMediaProcessing } from './media.queue';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;

type AllowedMime = 'image/jpeg' | 'image/png' | 'image/webp';

const detectMimeFromHeader = (buffer: Buffer): AllowedMime | null => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
};

class MagicNumberValidator extends Transform {
  private readonly maxProbeBytes = 12;
  private probe = Buffer.alloc(0);
  private verified = false;
  private detectedMime: AllowedMime | null = null;

  get mime(): AllowedMime | null {
    return this.detectedMime;
  }

  override _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    if (!this.verified) {
      this.probe = Buffer.concat([this.probe, chunk]);

      if (this.probe.length >= this.maxProbeBytes) {
        const detected = detectMimeFromHeader(this.probe);
        if (!detected) {
          callback(new AppError('Unsupported media type', 415, 'UNSUPPORTED_MEDIA_TYPE'));
          return;
        }
        this.detectedMime = detected;
        this.verified = true;
        this.emit('verified', detected);
      }
    }

    callback(null, chunk);
  }
}

class ExifProbeCollector extends Transform {
  private readonly maxBytes: number;
  private collected = Buffer.alloc(0);

  constructor(maxBytes: number) {
    super();
    this.maxBytes = maxBytes;
  }

  get buffer(): Buffer {
    return this.collected;
  }

  override _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    if (this.collected.length < this.maxBytes) {
      const remaining = this.maxBytes - this.collected.length;
      this.collected = Buffer.concat([this.collected, chunk.subarray(0, remaining)]);
    }

    callback(null, chunk);
  }
}

export const uploadMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requester = req.user;
    if (!requester) {
      return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    }

    let draftId = req.header('x-media-draft-id')?.trim() || null;
    if (draftId) {
      const draft = await MediaDraftModel.findById(draftId).lean();
      if (!draft || draft.status !== 'OPEN' || draft.owner_user_id !== requester.id) {
        return next(new AppError('Invalid media draft', 400, 'INVALID_MEDIA_DRAFT'));
      }
    }

    const contentType = req.headers['content-type'] ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return next(new AppError('Expected multipart/form-data', 400, 'INVALID_CONTENT_TYPE'));
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: MAX_UPLOAD_SIZE_BYTES,
      },
    });

    let uploadPromise: Promise<{ key: string; url: string }> | null = null;
    let receivedFile = false;
    let fileTooLarge = false;

    busboy.on('field', (fieldname: string, value: string) => {
      if (fieldname === 'draftId' && !draftId) {
        draftId = value.trim() || null;
      }
    });

    busboy.on('file', (_fieldname: string, file: NodeJS.ReadableStream) => {
      if (receivedFile) {
        file.resume();
        return;
      }

      receivedFile = true;

      const validator = new MagicNumberValidator();
      const exifCollector = new ExifProbeCollector(512 * 1024);
      const passThrough = new PassThrough();

      file.on('limit', () => {
        fileTooLarge = true;
        validator.destroy(
          new AppError('File too large (max 10MB)', 415, 'UNSUPPORTED_MEDIA_TYPE'),
        );
      });

      validator.on('error', () => {
        file.unpipe(validator);
        passThrough.destroy(new AppError('Unsupported media type', 415, 'UNSUPPORTED_MEDIA_TYPE'));
      });

      file.pipe(validator).pipe(exifCollector).pipe(passThrough);

      uploadPromise = new Promise<{ key: string; url: string }>((resolve, reject) => {
        validator.once('verified', () => {
          const mime = validator.mime;
          if (!mime) {
            reject(new AppError('Unsupported media type', 415, 'UNSUPPORTED_MEDIA_TYPE'));
            return;
          }

          const key = buildObjectKey(mime);
          uploadStreamToS3(passThrough, mime, key)
            .then(async (uploaded) => {
              let exifGps: { latitude: number; longitude: number } | null = null;

              try {
                const gps = await exifr.gps(exifCollector.buffer);
                if (
                  gps &&
                  typeof gps.latitude === 'number' &&
                  typeof gps.longitude === 'number'
                ) {
                  exifGps = {
                    latitude: gps.latitude,
                    longitude: gps.longitude,
                  };
                }
              } catch {
                exifGps = null;
              }

              await MediaUploadModel.updateOne(
                { key: uploaded.key },
                {
                  $set: {
                    key: uploaded.key,
                    url: uploaded.url,
                    owner_user_id: requester.id,
                    draft_id: draftId,
                    attached_report_id: null,
                    expires_at: new Date(Date.now() + UPLOAD_TTL_MS),
                    mime,
                    exif_gps: exifGps,
                    exif_verified: Boolean(exifGps),
                    processing_status: 'QUEUED',
                    processing_error: null,
                    optimized_format: null,
                    optimized_url: null,
                  },
                },
                { upsert: true },
              );

              await enqueueMediaProcessing({
                key: uploaded.key,
                url: uploaded.url,
              });

              resolve(uploaded);
            })
            .catch(reject);
        });

        validator.once('error', reject);
      });
    });

    busboy.on('finish', async () => {
      try {
        if (!receivedFile || !uploadPromise) {
          return next(new AppError('No file uploaded', 400, 'FILE_REQUIRED'));
        }

        const uploaded = await uploadPromise;
        return res.status(201).json({
          key: uploaded.key,
          url: uploaded.url,
        });
      } catch (error) {
        if (fileTooLarge) {
          return next(new AppError('File too large (max 10MB)', 415, 'UNSUPPORTED_MEDIA_TYPE'));
        }
        return next(error);
      }
    });

    busboy.on('error', (error: Error) => next(error));

    req.pipe(busboy);
  } catch (error) {
    return next(error);
  }
};
