import type { Report } from "@sidewalk/shared";
import { prisma } from "../../../shared/database/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";
import type { ReportCreateRequest, ModerationActionRequest } from "../types/report.types.js";
import type { AuthTokenPayload } from "../../auth/types/auth.types.js";

function toReport(row: { id: string; authorId: string; title: string; description: string; status: string; visibility: string; location: string | null; createdAt: Date; updatedAt: Date }): Report {
  return {
    id: row.id,
    authorId: row.authorId,
    title: row.title,
    description: row.description,
    status: row.status as Report["status"],
    visibility: row.visibility as Report["visibility"],
    location: row.location ?? undefined,
    mediaUrls: [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const reportService = {
  async create(data: ReportCreateRequest, user: AuthTokenPayload): Promise<Report> {
    const row = await prisma.report.create({
      data: {
        authorId: user.sub,
        title: data.title,
        description: data.description,
        status: "draft",
        visibility: data.visibility,
        location: data.location,
      },
    });
    return toReport(row);
  },

  async findById(id: string): Promise<Report> {
    const row = await prisma.report.findUnique({ where: { id } });
    if (!row) throw new NotFoundError(`Report ${id} not found`);
    return toReport(row);
  },

  async list(filters?: { status?: string; authorId?: string }): Promise<{ reports: Report[]; total: number }> {
    const where = {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.authorId ? { authorId: filters.authorId } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.report.findMany({ where, orderBy: { createdAt: "desc" } }),
      prisma.report.count({ where }),
    ]);
    return { reports: rows.map(toReport), total };
  },

  async moderate(reportId: string, data: ModerationActionRequest, moderatorId: string): Promise<Report> {
    const row = await prisma.report.findUnique({ where: { id: reportId } });
    if (!row) throw new NotFoundError(`Report ${reportId} not found`);
    if (row.status === "closed") throw new ConflictError("Cannot moderate a closed report");
    if (!["approved", "rejected", "flagged", "escalated"].includes(data.outcome)) {
      throw new ValidationError(`Invalid moderation outcome: ${data.outcome}`);
    }

    const newStatus = data.outcome === "approved" ? "resolved" : "closed";
    const [updated] = await prisma.$transaction([
      prisma.report.update({ where: { id: reportId }, data: { status: newStatus } }),
      prisma.moderation.create({ data: { reportId, moderatorId, outcome: data.outcome, reason: data.reason } }),
    ]);
    return toReport(updated);
  },
};
