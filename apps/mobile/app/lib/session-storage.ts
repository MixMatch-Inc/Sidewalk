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
    return null;
  }

  return {
    accessToken: values[ACCESS_TOKEN_KEY],
    accessTokenExpiresAt: values[ACCESS_TOKEN_EXPIRES_AT_KEY],
    refreshToken: values[REFRESH_TOKEN_KEY],
    refreshTokenExpiresAt: values[REFRESH_TOKEN_EXPIRES_AT_KEY],
    email: values[EMAIL_KEY],
    role:
      values[ROLE_KEY] === 'AGENCY_ADMIN' || values[ROLE_KEY] === 'CITIZEN'
        ? values[ROLE_KEY]
        : undefined,
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
