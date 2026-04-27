import AsyncStorage from '@react-native-async-storage/async-storage';

const REPORT_LIST_CACHE_KEY = 'sidewalk:mobile:cached-reports-list';
const REPORT_DETAIL_CACHE_PREFIX = 'sidewalk:mobile:cached-report-detail:';

type CachedItem<T> = {
  timestamp: string;
  data: T;
};

export const readCachedReportsList = async <T>(): Promise<CachedItem<T> | null> => {
  try {
    const stored = await AsyncStorage.getItem(REPORT_LIST_CACHE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as CachedItem<T>;
    if (!parsed?.timestamp || !parsed?.data) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const writeCachedReportsList = async <T>(data: T) => {
  const payload: CachedItem<T> = {
    timestamp: new Date().toISOString(),
    data,
  };

  await AsyncStorage.setItem(REPORT_LIST_CACHE_KEY, JSON.stringify(payload));
};

export const clearCachedReportsList = async () => {
  await AsyncStorage.removeItem(REPORT_LIST_CACHE_KEY);
};

export const readCachedReportDetail = async <T>(reportId: string): Promise<CachedItem<T> | null> => {
  try {
    const stored = await AsyncStorage.getItem(`${REPORT_DETAIL_CACHE_PREFIX}${reportId}`);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as CachedItem<T>;
    if (!parsed?.timestamp || !parsed?.data) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const writeCachedReportDetail = async <T>(reportId: string, data: T) => {
  const payload: CachedItem<T> = {
    timestamp: new Date().toISOString(),
    data,
  };

  await AsyncStorage.setItem(`${REPORT_DETAIL_CACHE_PREFIX}${reportId}`, JSON.stringify(payload));
};

export const clearCachedReportDetail = async (reportId: string) => {
  await AsyncStorage.removeItem(`${REPORT_DETAIL_CACHE_PREFIX}${reportId}`);
};
