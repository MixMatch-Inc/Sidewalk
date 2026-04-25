const DEFAULT_API_URL = 'http://localhost:5000';

const normalizeApiUrl = (value: string) => value.replace(/\/+$/, '');

const validateApiUrl = (value: string): string => {
  try {
    const parsed = new URL(value);
    return normalizeApiUrl(parsed.toString());
  } catch {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error(
        `[env] EXPO_PUBLIC_API_URL is misconfigured: "${value}" is not a valid URL. ` +
          'Set it to a full URL such as http://localhost:5000.',
      );
    }
    console.warn(`[env] Invalid EXPO_PUBLIC_API_URL "${value}", falling back to ${DEFAULT_API_URL}`);
    return DEFAULT_API_URL;
  }
};

export const getMobileEnv = () => {
  const rawApiUrl = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
  return { apiUrl: validateApiUrl(rawApiUrl) };
};
