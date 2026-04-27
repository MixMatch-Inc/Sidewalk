import { Router } from 'express';
import {
  getPublicReportBySlug,
  getPublicReportById,
} from './public-report.controller.js';

const router = Router();

// Get public report by slug (primary public endpoint)
router.get('/slug/:slug', getPublicReportBySlug);

// Legacy endpoint: redirect from ID to slug for backward compatibility
router.get('/id/:id', getPublicReportById);

export { router as publicReportRoutes };
