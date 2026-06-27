import type { Request, Response } from "express";
import { ValidationError } from "../../../shared/errors/AppError.js";
import { reportService } from "../services/report.service.js";
import { reportSubmissionSchema, moderationSchema } from "../validators/report.validator.js";
import type { AuthTokenPayload } from "../../auth/types/auth.types.js";

export const reportController = {
  async create(req: Request, res: Response): Promise<void> {
    const parsed = reportSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const user = (req as any).user as AuthTokenPayload;
    const result = await reportService.create(parsed.data, user);
    res.status(201).json({ success: true, data: result });
  },

  async list(req: Request, res: Response): Promise<void> {
    const status = req.query.status as string | undefined;
    const authorId = req.query.authorId as string | undefined;
    const result = await reportService.list({ status, authorId });
    res.json({ success: true, data: result.reports, total: result.total });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const report = await reportService.findById(id);
    res.json({ success: true, data: report });
  },

  async moderate(req: Request, res: Response): Promise<void> {
    const parsed = moderationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const moderator = (req as any).user as AuthTokenPayload;
    const id = req.params.id as string;
    const report = await reportService.moderate(id, parsed.data, moderator.sub);
    res.json({ success: true, data: report });
  },
};
