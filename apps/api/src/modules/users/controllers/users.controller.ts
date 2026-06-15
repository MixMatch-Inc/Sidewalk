import type { Response } from "express";

import type { AuthenticatedRequest } from "../../../shared/middleware/requireAuth.js";
import { userService } from "../services/user.service.js";

export const usersController = {
  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = await userService.getById(req.userId!);
    res.status(200).json(user);
  }
};
