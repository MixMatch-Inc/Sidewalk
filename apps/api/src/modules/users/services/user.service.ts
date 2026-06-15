import type { PublicUser } from "@sidewalk/shared";

import { NotFoundError } from "../../../shared/errors/AppError.js";
import { userRepository } from "../repositories/user.repository.js";
import { toPublicUser } from "../types/user.types.js";

export const userService = {
  async getById(id: string): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    return toPublicUser(user);
  }
};
