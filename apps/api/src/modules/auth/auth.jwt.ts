import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { AppError } from '../../core/errors/app-error';
import { getJwtEnv } from '../../config/env';
import { AuthenticatedUser, Role } from './auth.types';

type JwtAlgorithm = 'HS256' | 'RS256';

type JwtConfig = {
  algorithm: JwtAlgorithm;
  signingKey: string;
  verificationKey: string;
};

const toPem = (value: string) => value.replace(/\\n/g, '\n');

export const getJwtConfig = (): JwtConfig => {
  const env = getJwtEnv();
  const privateKey = env.JWT_PRIVATE_KEY;
  const publicKey = env.JWT_PUBLIC_KEY;
  const secret = env.JWT_SECRET;

  if (privateKey && publicKey) {
    return {
      algorithm: 'RS256',
      signingKey: toPem(privateKey),
      verificationKey: toPem(publicKey),
    };
  }

  if (secret) {
    return {
      algorithm: 'HS256',
      signingKey: secret,
      verificationKey: secret,
    };
  }

  throw new AppError(
    'JWT configuration missing. Set JWT_PUBLIC_KEY/JWT_PRIVATE_KEY or JWT_SECRET',
    500,
    'JWT_CONFIG_MISSING',
  );
};

type AccessPayload = {
  sub: string;
  role: Role;
  district?: string;
  tokenType: 'access';
};

type RefreshPayload = {
  sub: string;
  role: Role;
  district?: string;
  deviceId: string;
  familyId: string;
  tokenId: string;
  tokenType: 'refresh';
};

export const signAccessToken = (user: AuthenticatedUser): string => {
  const config = getJwtConfig();
  const { ACCESS_TOKEN_EXPIRES_IN } = getJwtEnv();
  const payload: AccessPayload = {
    sub: user.id,
    role: user.role,
    district: user.district,
    tokenType: 'access',
  };

  return jwt.sign(payload, config.signingKey, {
    algorithm: config.algorithm,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
  });
};

export const signRefreshToken = (
  user: AuthenticatedUser,
  deviceId: string,
  familyId: string,
  tokenId: string,
): string => {
  const config = getJwtConfig();
  const { REFRESH_TOKEN_EXPIRES_IN } = getJwtEnv();
  const payload: RefreshPayload = {
    sub: user.id,
    role: user.role,
    district: user.district,
    deviceId,
    familyId,
    tokenId,
    tokenType: 'refresh',
  };

  return jwt.sign(payload, config.signingKey, {
    algorithm: config.algorithm,
    expiresIn: REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
  });
};

export const verifyJwt = (token: string) => {
  const config = getJwtConfig();
  return jwt.verify(token, config.verificationKey, {
    algorithms: [config.algorithm],
  });
};
