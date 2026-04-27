import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'sidewalk:mobile:access-token';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'sidewalk:mobile:access-token-expires-at';
const REFRESH_TOKEN_KEY = 'sidewalk:mobile:refresh-token';
const REFRESH_TOKEN_EXPIRES_AT_KEY = 'sidewalk:mobile:refresh-token-expires-at';
const EMAIL_KEY = 'sidewalk:mobile:email';
const ROLE_KEY = 'sidewalk:mobile:role';
const DEVICE_ID_KEY = 'sidewalk:mobile:device-id';

export type StoredSession = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  email: string;
  role?: 'CITIZEN' | 'AGENCY_ADMIN';
};

const createFallbackDeviceId = () =>
  `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isSafeTimestamp = (value: string | null | undefined) => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
};

const normalizeRole = (value: string | null | undefined): StoredSession['role'] =>
  value === 'AGENCY_ADMIN' || value === 'CITIZEN' ? value : undefined;

export const getDeviceId = async () => {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : createFallbackDeviceId();

  await AsyncStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
};

export const persistSession = async (session: StoredSession) => {
  await AsyncStorage.setMany({
    [ACCESS_TOKEN_KEY]: session.accessToken,
    [ACCESS_TOKEN_EXPIRES_AT_KEY]: session.accessTokenExpiresAt,
    [REFRESH_TOKEN_KEY]: session.refreshToken,
    [REFRESH_TOKEN_EXPIRES_AT_KEY]: session.refreshTokenExpiresAt,
    [EMAIL_KEY]: session.email,
    [ROLE_KEY]: session.role ?? 'CITIZEN',
  });
};

export const readStoredSession = async (): Promise<StoredSession | null> => {
  const values = await AsyncStorage.getMany([
    ACCESS_TOKEN_KEY,
    ACCESS_TOKEN_EXPIRES_AT_KEY,
    REFRESH_TOKEN_KEY,
    REFRESH_TOKEN_EXPIRES_AT_KEY,
    EMAIL_KEY,
    ROLE_KEY,
  ]);

  if (
    !values[ACCESS_TOKEN_KEY] ||
    !values[ACCESS_TOKEN_EXPIRES_AT_KEY] ||
    !values[REFRESH_TOKEN_KEY] ||
    !values[REFRESH_TOKEN_EXPIRES_AT_KEY] ||
    !values[EMAIL_KEY]
  ) {
    await clearStoredSession();
    return null;
  }

  if (
    !isSafeTimestamp(values[ACCESS_TOKEN_EXPIRES_AT_KEY]) ||
    !isSafeTimestamp(values[REFRESH_TOKEN_EXPIRES_AT_KEY])
  ) {
    await clearStoredSession();
    return null;
  }

  if (typeof values[ACCESS_TOKEN_KEY] !== 'string' || values[ACCESS_TOKEN_KEY].trim() === '') {
    await clearStoredSession();
    return null;
  }

  return {
    accessToken: values[ACCESS_TOKEN_KEY],
    accessTokenExpiresAt: values[ACCESS_TOKEN_EXPIRES_AT_KEY],
    refreshToken: values[REFRESH_TOKEN_KEY],
    refreshTokenExpiresAt: values[REFRESH_TOKEN_EXPIRES_AT_KEY],
    email: values[EMAIL_KEY],
    role: normalizeRole(values[ROLE_KEY])edSession();
    return null;
  }

  if (
    !isSafeTimestamp(values[ACCESS_TOKEN_EXPIRES_AT_KEY]) ||
    !isSafeTimestamp(values[REFRESH_TOKEN_EXPIRES_AT_KEY])
  ) {
    await clearStoredSession();
    return null;
  }

  if (typeof values[ACCESS_TOKEN_KEY] !== 'string' || values[ACCESS_TOKEN_KEY'].trim() === '') {
    await clearStoredSession();
    return null;
  }

  return {
    accessToken: values[ACCESS_TOKEN_KEY],
    accessTokenExpiresAt: values[ACCESS_TOKEN_EXPIRES_AT_KEY],
    refreshToken: values[REFRESH_TOKEN_KEY],
    refreshTokenExpiresAt: values[REFRESH_TOKEN_EXPIRES_AT_KEY],
    email: values[EMAIL_KEY],
    role: normalizeRole(values[ROLE_KEY]),
  };
};

export const clearStoredSession = async () => {
  await AsyncStorage.removeMany([
    ACCESS_TOKEN_KEY,
    ACCESS_TOKEN_EXPIRES_AT_KEY,
    REFRESH_TOKEN_KEY,
    REFRESH_TOKEN_EXPIRES_AT_KEY,
    EMAIL_KEY,
    ROLE_KEY,
  ]);
};
