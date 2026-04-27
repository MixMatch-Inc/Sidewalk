export type AnalyticsEventName =
  | 'auth.otp_requested'
  | 'auth.verify_started'
  | 'auth.verify_success'
  | 'auth.verify_failure'
  | 'auth.session_restore'
  | 'reports.list.view'
  | 'reports.list.refresh'
  | 'reports.detail.view'
  | 'reports.detail.share'
  | 'reports.create.submit'
  | 'reports.create.success'
  | 'reports.create.failure'
  | 'reports.upload.start'
  | 'reports.upload.success'
  | 'reports.upload.failure'
  | 'reports.deep_link.open';

export type AnalyticsEventProperties = Record<string, string | number | boolean | undefined>;

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  properties?: AnalyticsEventProperties;
};

export type AnalyticsAdapter = (event: AnalyticsEvent) => void;

const defaultAnalyticsAdapter: AnalyticsAdapter = (event) => {
  console.debug('[analytics]', event.name, event.properties ?? {});
};

let analyticsAdapter: AnalyticsAdapter = defaultAnalyticsAdapter;

export const setAnalyticsAdapter = (adapter: AnalyticsAdapter) => {
  analyticsAdapter = adapter || defaultAnalyticsAdapter;
};

export const trackEvent = (name: AnalyticsEventName, properties?: AnalyticsEventProperties) => {
  analyticsAdapter({ name, properties });
};

export const analyticsEventTaxonomy = {
  auth: {
    otpRequested: 'auth.otp_requested',
    verifyStarted: 'auth.verify_started',
    verifySuccess: 'auth.verify_success',
    verifyFailure: 'auth.verify_failure',
    sessionRestore: 'auth.session_restore',
  },
  reports: {
    listView: 'reports.list.view',
    listRefresh: 'reports.list.refresh',
    detailView: 'reports.detail.view',
    detailShare: 'reports.detail.share',
    createSubmit: 'reports.create.submit',
    createSuccess: 'reports.create.success',
    createFailure: 'reports.create.failure',
    uploadStart: 'reports.upload.start',
    uploadSuccess: 'reports.upload.success',
    uploadFailure: 'reports.upload.failure',
    deepLinkOpen: 'reports.deep_link.open',
  },
};
