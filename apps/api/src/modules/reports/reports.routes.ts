import { Router } from 'express';
import {
  createReport,
  getReportDetail,
  getReportList,
  getMapReports,
  getMyReports,
  verifyReport,
  updateReportStatus,
  verifyStatus,
} from './reports.controller';
import { authenticateToken, requireRole } from '../auth/auth.middleware';
import { validateRequest } from '../../core/validation/validate-request';
import { stellarAnchoringRateLimiter } from '../../core/rate-limit/rate-limit.middleware';
import {
  createReportBodySchema,
  myReportsQuerySchema,
  reportsMapQuerySchema,
  updateReportStatusBodySchema,
  verifyReportBodySchema,
  verifyStatusBodySchema,
} from './reports.schemas';

const router: Router = Router();

router.get(
  '/',
  authenticateToken,
  requireRole(['CITIZEN', 'AGENCY_ADMIN']),
  validateRequest({ query: reportListQuerySchema }),
  getReportList,
);

router.get(
  '/:reportId',
  authenticateToken,
  requireRole(['CITIZEN', 'AGENCY_ADMIN']),
  validateRequest({ params: reportDetailParamsSchema }),
  getReportDetail,
);

router.get(
  '/map',
  authenticateToken,
  requireRole(['CITIZEN', 'AGENCY_ADMIN']),
  validateRequest({ query: reportsMapQuerySchema }),
  getMapReports,
);

router.get(
  '/mine',
  authenticateToken,
  requireRole(['CITIZEN', 'AGENCY_ADMIN']),
  validateRequest({ query: myReportsQuerySchema }),
  getMyReports,
);

router.post(
  '/',
  authenticateToken,
  requireRole(['CITIZEN', 'AGENCY_ADMIN']),
  stellarAnchoringRateLimiter,
  validateRequest({ body: createReportBodySchema }),
  createReport,
);

router.post(
  '/verify',
  authenticateToken,
  requireRole(['CITIZEN', 'AGENCY_ADMIN']),
  validateRequest({ body: verifyReportBodySchema }),
  verifyReport,
);

router.post(
  '/status',
  authenticateToken,
  requireRole(['AGENCY_ADMIN']),
  validateRequest({ body: updateReportStatusBodySchema }),
  updateReportStatus,
);

router.post(
  '/status/verify',
  authenticateToken,
  requireRole(['AGENCY_ADMIN']),
  validateRequest({ body: verifyStatusBodySchema }),
  verifyStatus,
);

export default router;
