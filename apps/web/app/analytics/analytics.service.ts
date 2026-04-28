import { Injectable } from '@nestjs/common';
import { AnalyticsEvent } from './analytics.types';
import { sanitizePayload } from './analytics.sanitizer';

@Injectable()
export class AnalyticsService {
  track(event: AnalyticsEvent) {
    const safePayload = sanitizePayload(event.payload || {});

    const enrichedEvent = {
      ...event,
      payload: safePayload,
      timestamp: Date.now(),
    };

    // Replace with Segment / PostHog / Amplitude
    console.log('📊 Analytics Event:', enrichedEvent);

    return enrichedEvent;
  }
}