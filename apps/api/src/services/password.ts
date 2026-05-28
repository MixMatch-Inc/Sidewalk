/**
 * Password hashing service — bcrypt, cost factor 12.
 *
 * Cost 12 is a reasonable default for a hackathon starter: ~250 ms on modest
 * hardware. Raise to 13–14 before a production launch.
 */
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
