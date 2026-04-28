export const AnalyticsEvents = {
  // Auth
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILURE: 'auth_failure',

  // Reports
  REPORT_CREATED: 'report_created',
  REPORT_VIEWED: 'report_viewed',

  // Proofs
  PROOF_VIEWED: 'proof_viewed',

  // Queue (agency)
  QUEUE_APPROVED: 'queue_approved',
  QUEUE_REJECTED: 'queue_rejected',
  QUEUE_ESCALATED: 'queue_escalated',

  // Admin
  SETTINGS_UPDATED: 'settings_updated',
} as const;