import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import type { LoginResponse, RegisterResponse } from "@sidewalk/shared";

import { env } from "../../../shared/config/env.js";
import { ConflictError, UnauthorizedError } from "../../../shared/errors/AppError.js";
import { userRepository } from "../../users/repositories/user.repository.js";
import { toPublicUser } from "../../users/types/user.types.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validator.js";

const PASSWORD_SALT_ROUNDS = 10;

function signToken(userId: string, email: string): string {
  const options: jwt.SignOptions = { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] };
  return jwt.sign({ sub: userId, email }, env.JWT_SECRET, options);
}

export const authService = {
  async register(input: RegisterInput): Promise<RegisterResponse> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
    const user = await userRepository.create({ email: input.email, passwordHash });
    return toPublicUser(user);
  },

  async login(input: LoginInput): Promise<LoginResponse> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    return {
      token: signToken(user.id, user.email),
      user: toPublicUser(user)
    };
  }
};
