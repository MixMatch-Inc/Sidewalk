import { prisma } from "../../../shared/database/prisma.js";
import type { User } from "../types/user.types.js";

export const userRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: { email: string; passwordHash: string }): Promise<User> {
    return prisma.user.create({ data });
  }
};
