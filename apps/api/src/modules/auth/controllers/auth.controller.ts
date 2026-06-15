import type { Request, Response } from "express";

import { ValidationError } from "../../../shared/errors/AppError.js";
import { authService } from "../services/auth.service.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const result = await authService.register(parsed.data);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response): Promise<void> {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const result = await authService.login(parsed.data);
    res.status(200).json(result);
  }
};
