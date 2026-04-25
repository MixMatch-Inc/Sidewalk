import Constants from 'expo-constants';

const fallbackApiBaseUrl = 'http://localhost:5000';

const resolveApiBaseUrl = () => {
  const configuredUrl =
    Constants.expoConfig?.extra?.apiBaseUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    fallbackApiBaseUrl;

  return configuredUrl.replace(/\/+$/, '');
};

export const apiBaseUrl = resolveApiBaseUrl();

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

type AuthorizedInit = RequestInit & {
  contentType?: string | null;
};

const readJsonPayload = async <T>(response: Response): Promise<(T & ApiErrorPayload) | null> => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T & ApiErrorPayload;
  } catch {
    return null;
  }
};

const toErrorMessage = (payload: ApiErrorPayload | null, fallback: string) =>
  payload?.error?.message ?? fallback;

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, init);
  const payload = await readJsonPayload<T>(response);

  if (!response.ok) {
    throw new Error(toErrorMessage(payload, 'Request failed'));
  }

  return (payload ?? {}) as T;
};

export const authorizedFetch = async (
  path: string,
  accessToken: string,
  init?: AuthorizedInit,
): Promise<Response> => {
  const { contentType = 'application/json', headers, ...rest } = init ?? {};

  const mergedHeaders = new Headers(headers ?? {});
  mergedHeaders.set('Authorization', `Bearer ${accessToken}`);
  if (contentType) {
    mergedHeaders.set('Content-Type', contentType);
  }

  return fetch(`${apiBaseUrl}${path}`, {
    ...rest,
    headers: mergedHeaders,
  });
};

export const authorizedApiFetch = async <T>(
  path: string,
  accessToken: string,
  init?: AuthorizedInit,
): Promise<T> => {
  const response = await authorizedFetch(path, accessToken, init);
  const payload = await readJsonPayload<T>(response);

  if (!response.ok) {
    throw new Error(toErrorMessage(payload, 'Request failed'));
  }

  return (payload ?? {}) as T;
};
