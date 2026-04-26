import type { Types } from 'mongoose';
import {
  ReportAssignmentModel,
  type AssignmentStatus,
} from './report-assignment.model.js';

export async function createAssignment(params: {
  reportId: Types.ObjectId;
  assigneeId: Types.ObjectId;
  actorId: Types.ObjectId;
  note?: string;
}) {
  // Release any existing active assignment before creating a new one
  await ReportAssignmentModel.updateMany(
    { reportId: params.reportId, status: 'ACTIVE' },
    { status: 'REASSIGNED', releasedAt: new Date() },
  );

  return ReportAssignmentModel.create({
    ...params,
    status: 'ACTIVE' as AssignmentStatus,
    assignedAt: new Date(),
  });
}

export async function getActiveAssignment(reportId: Types.ObjectId) {
  return ReportAssignmentModel.findOne({ reportId, status: 'ACTIVE' }).lean();
}

export async function releaseAssignment(
  reportId: Types.ObjectId,
  actorId: Types.ObjectId,
) {
  return ReportAssignmentModel.findOneAndUpdate(
    { reportId, status: 'ACTIVE' },
    { status: 'RELEASED', releasedAt: new Date(), actorId },
    { new: true },
  );
}

export async function listAssignmentHistory(reportId: Types.ObjectId) {
  return ReportAssignmentModel.find({ reportId })
    .sort({ assignedAt: -1 })
    .lean();
}
