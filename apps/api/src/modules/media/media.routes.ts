import { Router } from 'express';
import { authenticateToken, requireRole } from '../auth/auth.middleware';
import { uploadMedia } from './media.upload';
import { getSecureMediaUrl } from './media.controller';
import { validateRequest } from '../../core/validation/validate-request';
import { secureMediaParamsSchema } from './media.schemas';

const router: Router = Router();

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
