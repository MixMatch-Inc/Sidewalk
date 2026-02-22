import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import { AppError } from '../../core/errors/app-error';
import { createInitialSession } from './auth.tokens';
import { sendOtpEmail } from './otp.email';
import { otpStore } from './otp.store';
import { Role } from './auth.types';

const OTP_TTL_SECONDS = 5 * 60;
const OTP_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 3;
const OTP_LOCK_SECONDS = 15 * 60;

type OtpPayload = {
  hash: string;
  attempts: number;
};

const serialize = (payload: OtpPayload) => JSON.stringify(payload);
const deserialize = (raw: string): OtpPayload => JSON.parse(raw) as OtpPayload;
const normalizeEmail = (email: string) => email.trim().toLowerCase();

const generateOtpCode = (): string => randomInt(100000, 1000000).toString();

export const requestOtp = async (rawEmail: string): Promise<{ expiresInSeconds: number }> => {
  const email = normalizeEmail(rawEmail);

  const lockTTL = await otpStore.getLockTTL(email);
  if (lockTTL > 0) {
    throw new AppError(
      `Too many failed attempts. Try again in ${lockTTL} seconds.`,
      429,
      'OTP_LOCKED',
    );
  }

  const cooldownTTL = await otpStore.getCooldownTTL(email);
  if (cooldownTTL > 0) {
    throw new AppError(
      `OTP recently requested. Retry in ${cooldownTTL} seconds.`,
      429,
      'OTP_COOLDOWN',
    );
  }

  const otpCode = generateOtpCode();
  const otpHash = await bcrypt.hash(otpCode, 12);

  await otpStore.setOtp(email, serialize({ hash: otpHash, attempts: 0 }), OTP_TTL_SECONDS);
  await otpStore.setCooldown(email, OTP_COOLDOWN_SECONDS);
  await sendOtpEmail(email, otpCode);

  return { expiresInSeconds: OTP_TTL_SECONDS };
};

export const verifyOtpAndCreateSession = async (params: {
  email: string;
  code: string;
  deviceId: string;
  clientType: 'web' | 'mobile';
  role?: Role;
  district?: string;
}) => {
  const email = normalizeEmail(params.email);
  const stored = await otpStore.getOtp(email);

  if (!stored) {
    throw new AppError('OTP expired or not found', 401, 'OTP_EXPIRED');
  }

  const payload = deserialize(stored);
  const isMatch = await bcrypt.compare(params.code, payload.hash);

  if (!isMatch) {
    const nextAttempts = payload.attempts + 1;

    if (nextAttempts > OTP_MAX_ATTEMPTS) {
      await otpStore.clearOtp(email);
      await otpStore.setLock(email, OTP_LOCK_SECONDS);
      throw new AppError('OTP locked after too many failed attempts', 429, 'OTP_LOCKED');
    }

    await otpStore.setOtp(
      email,
      serialize({
        hash: payload.hash,
        attempts: nextAttempts,
      }),
      OTP_TTL_SECONDS,
    );
    throw new AppError('Invalid OTP code', 401, 'INVALID_OTP');
  }

  await otpStore.clearOtp(email);

  const role = params.role ?? 'CITIZEN';
  const session = await createInitialSession(
    {
      id: email,
      role,
      district: params.district,
    },
    params.deviceId,
  );

  return {
    ...session,
    clientType: params.clientType,
  };
};
