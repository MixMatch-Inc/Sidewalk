import { Router } from 'express';
import { authenticateToken, requireRole } from '../auth/auth.middleware.js';
import {
  assignReport,
  releaseReportAssignment,
  getReportAssignment,
  getAssignmentHistory,
  getEligibleAssignees,
} from './report-assignment.controller.js';

const router = Router();

// All assignment routes require authentication and agency role
router.use(authenticateToken);
router.use(requireRole(['AGENCY_ADMIN']));

// Assign a report to an agency user
router.post('/assign', assignReport);

// Release/return a report assignment
router.post('/release', releaseReportAssignment);

// Get current assignment for a report
router.get('/:reportId/assignment', getReportAssignment);

// Get assignment history for a report
router.get('/:reportId/assignment/history', getAssignmentHistory);

// Get eligible assignees for assignment
router.get('/assignees', getEligibleAssignees);

export { router as assignmentRoutes };
