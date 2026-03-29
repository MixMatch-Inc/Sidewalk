import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../core/errors/app-error';
import { MediaDraftModel } from './media-draft.model';
import { MediaUploadModel } from './media-upload.model';
import { generatePresignedGetObjectUrl } from './media.s3';
import { ReportModel } from '../reports/report.model';
import { CreateMediaDraftBodyDTO, SecureMediaParamsDTO } from './media.schemas';

const PRESIGNED_TTL_SECONDS = 15 * 60;
const MEDIA_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export const createMediaDraft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    void (req.body as CreateMediaDraftBodyDTO);

    const requester = req.user;
    if (!requester) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const draft = await MediaDraftModel.create({
      owner_user_id: requester.id,
      status: 'OPEN',
      expires_at: new Date(Date.now() + MEDIA_DRAFT_TTL_MS),
    });

    return res.status(201).json({
      draftId: String(draft._id),
      status: draft.status,
      expiresAt: draft.expires_at.toISOString(),
    });
  } catch (error) {
    return next(error);
  }
};

export const getSecureMediaUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { fileId } = req.params as unknown as SecureMediaParamsDTO;

    const media = await MediaUploadModel.findById(fileId).lean();
    if (!media) {
      throw new AppError('Media file not found', 404, 'MEDIA_NOT_FOUND');
    }

    const report = await ReportModel.findOne({ media_urls: media.url })
      .select({ _id: 1, reporter_user_id: 1 })
      .lean();
    if (!report) {
      throw new AppError('Associated report not found', 404, 'REPORT_NOT_FOUND');
    }

    const requester = req.user;
    if (!requester) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const isAdmin = requester.role === 'AGENCY_ADMIN';
    const isOwner =
      typeof report.reporter_user_id === 'string' &&
      report.reporter_user_id === requester.id;

    if (!isAdmin && !isOwner) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    const secureUrl = await generatePresignedGetObjectUrl(
      media.key,
      PRESIGNED_TTL_SECONDS,
    );

    return res.status(200).json({
      fileId,
      expiresInSeconds: PRESIGNED_TTL_SECONDS,
      url: secureUrl,
    });
  } catch (error) {
    return next(error);
  }
};
