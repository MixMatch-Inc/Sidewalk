import type { Report } from "@sidewalk/shared";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";
import type { ReportCreateRequest, ModerationActionRequest } from "../types/report.types.js";
import type { AuthTokenPayload } from "../../auth/types/auth.types.js";

const reports: Map<string, Report> = new Map();
let nextId = 1;

export const reportService = {
  async create(data: ReportCreateRequest, user: AuthTokenPayload): Promise<Report> {
    const id = `report-${nextId++}`;
    const now = new Date().toISOString();
    const record: Report = {
      id,
      authorId: user.sub,
      title: data.title,
      description: data.description,
      status: "draft" as const,
      visibility: data.visibility,
      location: data.location,
      mediaUrls: data.mediaUrls ?? [],
      createdAt: now,
      updatedAt: now,
    };
    reports.set(id, record);
    return record;
  },

  async findById(id: string): Promise<Report> {
    const record = reports.get(id);
    if (!record) throw new NotFoundError(`Report ${id} not found`);
    return record;
  },

  async list(filters?: { status?: string; authorId?: string }): Promise<{ reports: Report[]; total: number }> {
    let values = Array.from(reports.values());
    if (filters?.status) {
      values = values.filter((r) => r.status === filters.status);
    }
    if (filters?.authorId) {
      values = values.filter((r) => r.authorId === filters.authorId);
    }
    return { reports: values, total: values.length };
  },

  async moderate(
    reportId: string,
    data: ModerationActionRequest,
    moderatorId: string,
  ): Promise<Report> {
    const record = reports.get(reportId);
    if (!record) throw new NotFoundError(`Report ${reportId} not found`);
    if (record.status === "closed") {
      throw new ConflictError("Cannot moderate a closed report");
    }
    if (!["approved", "rejected", "flagged", "escalated"].includes(data.outcome)) {
      throw new ValidationError(`Invalid moderation outcome: ${data.outcome}`);
    }
    record.status = data.outcome === "approved" ? "resolved" : "closed";
    record.updatedAt = new Date().toISOString();
    return record;
  },
};
