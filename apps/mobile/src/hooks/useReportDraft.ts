import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = 'report_draft_v1';

export interface ReportDraft {
  title: string;
  description: string;
  category: string;
  mediaUris: string[];
  savedAt: number;
}

export function useReportDraft() {
  const [draft, setDraft] = useState<ReportDraft | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then((raw) => {
      if (raw) setDraft(JSON.parse(raw));
    });
  }, []);

  const saveDraft = useCallback(async (data: Omit<ReportDraft, 'savedAt'>) => {
    const entry: ReportDraft = { ...data, savedAt: Date.now() };
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(entry));
    setDraft(entry);
  }, []);

  const clearDraft = useCallback(async () => {
    await AsyncStorage.removeItem(DRAFT_KEY);
    setDraft(null);
  }, []);

  const isDraftStale = draft
    ? Date.now() - draft.savedAt > 7 * 24 * 60 * 60 * 1000
    : false;

  return { draft, saveDraft, clearDraft, isDraftStale };
}
