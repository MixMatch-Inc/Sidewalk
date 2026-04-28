export type AnalyticsEventName =
  | 'auth_success'
  | 'auth_failure'
  | 'report_created'
  | 'report_viewed'
  | 'proof_viewed'
  | 'queue_approved'
  | 'queue_rejected'
  | 'queue_escalated'
  | 'settings_updated';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  payload?: Record<string, any>;
  userId?: string;
  timestamp?: number;
}