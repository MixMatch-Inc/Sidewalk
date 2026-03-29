const defaultApiUrl = 'http://localhost:5000';

const normalizeApiUrl = (value: string) => value.replace(/\/+$/, '');

export const getMobileEnv = () => {
  const rawApiUrl = process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl;

  try {
    const parsed = new URL(rawApiUrl);
    return {
      apiUrl: normalizeApiUrl(parsed.toString()),
    };
  } catch {
    return {
      apiUrl: defaultApiUrl,
    };
  }
};
