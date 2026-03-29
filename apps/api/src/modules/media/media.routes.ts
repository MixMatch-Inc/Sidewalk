import { Router } from 'express';
import { authenticateToken, requireRole } from '../auth/auth.middleware';
import { uploadMedia } from './media.upload';
import { createMediaDraft, getSecureMediaUrl } from './media.controller';
import { validateRequest } from '../../core/validation/validate-request';
import { createMediaDraftBodySchema, secureMediaParamsSchema } from './media.schemas';

const router: Router = Router();

router.post(
  '/drafts',
  authenticateToken,
  requireRole(['CITIZEN', 'AGENCY_ADMIN']),
  validateRequest({ body: createMediaDraftBodySchema }),
  createMediaDraft,
);

router.post(
  '/upload',
  authenticateToken,
  requireRole(['CITIZEN', 'AGENCY_ADMIN']),
  uploadMedia,
);

router.get(
  '/secure/:fileId',
  authenticateToken,
  requireRole(['CITIZEN', 'AGENCY_ADMIN']),
  validateRequest({ params: secureMediaParamsSchema }),
  getSecureMediaUrl,
);

export default router;
