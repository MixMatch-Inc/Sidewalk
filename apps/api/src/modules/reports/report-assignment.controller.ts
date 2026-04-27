import type { Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../core/validation/validate-request.js';
import { createAssignment, getActiveAssignment, releaseAssignment, listAssignmentHistory } from './report-assignment.service.js';
import { authenticatedRequest } from '../../modules/auth/auth.types.js';

const assignReportSchema = z.object({
  reportId: z.string().min(1),
  assigneeId: z.string().min(1),
  note: z.string().optional(),
});

const releaseReportSchema = z.object({
  reportId: z.string().min(1),
});

export async function assignReport(req: authenticatedRequest, res: Response) {
  try {
    const { reportId, assigneeId, note } = validateRequest(assignReportSchema, req.body);
    
    const assignment = await createAssignment({
      reportId: new (require('mongoose').Types.ObjectId)(reportId),
      assigneeId: new (require('mongoose').Types.ObjectId)(assigneeId),
      actorId: req.user.id,
      note,
    });

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Assignment creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign report',
    });
  }
}

export async function releaseReportAssignment(req: authenticatedRequest, res: Response) {
  try {
    const { reportId } = validateRequest(releaseReportSchema, req.body);
    
    const assignment = await releaseAssignment(
      new (require('mongoose').Types.ObjectId)(reportId),
      req.user.id,
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'No active assignment found for this report',
      });
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Assignment release failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to release assignment',
    });
  }
}

export async function getReportAssignment(req: Request, res: Response) {
  try {
    const { reportId } = req.params;
    
    const assignment = await getActiveAssignment(
      new (require('mongoose').Types.ObjectId)(reportId)
    );

    res.json({
      success: true,
      data: assignment || null,
    });
  } catch (error) {
    console.error('Failed to get assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assignment',
    });
  }
}

export async function getAssignmentHistory(req: Request, res: Response) {
  try {
    const { reportId } = req.params;
    
    const history = await listAssignmentHistory(
      new (require('mongoose').Types.ObjectId)(reportId)
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Failed to get assignment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assignment history',
    });
  }
}

export async function getEligibleAssignees(req: Request, res: Response) {
  try {
    // For now, return all agency admin users
    // In a real implementation, this would query the User model for agency users
    // and potentially filter by district/region
    const mockAssignees = [
      {
        id: '507f1f77bcf86cd799439011',
        name: 'John Agency Admin',
        email: 'john@agency.gov',
        role: 'AGENCY_ADMIN',
        district: 'District 1',
      },
      {
        id: '507f1f77bcf86cd799439012',
        name: 'Sarah Agency Admin',
        email: 'sarah@agency.gov',
        role: 'AGENCY_ADMIN',
        district: 'District 2',
      },
    ];

    res.json({
      success: true,
      data: mockAssignees,
    });
  } catch (error) {
    console.error('Failed to get eligible assignees:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get eligible assignees',
    });
  }
}
