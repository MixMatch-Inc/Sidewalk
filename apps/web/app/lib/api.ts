const fallbackApiBaseUrl = 'http://localhost:3000';

export const getApiBaseUrl = () =>
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl).replace(/\/+$/, '');
