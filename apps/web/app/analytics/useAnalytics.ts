import { AnalyticsService } from './analytics.service';

const analytics = new AnalyticsService();

export const useAnalytics = () => {
  const track = (name: string, payload?: Record<string, any>) => {
    analytics.track({ name: name as any, payload });
  };

  return { track };
};