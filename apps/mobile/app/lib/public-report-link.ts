export const PUBLIC_REPORT_PATH = /^\/reports\/([a-zA-Z0-9_-]{1,128})(?:\/.*)?$/;

export const parsePublicReportUrl = (urlString: string): string | null => {
  try {
    const url = new URL(urlString);
    let reportId: string | null = null;

    const match = PUBLIC_REPORT_PATH.exec(url.pathname);
    if (match) {
      reportId = match[1];
    }

    if (!reportId) {
      const queryId = url.searchParams.get('reportId');
      if (queryId && /^[a-zA-Z0-9_-]{1,128}$/.test(queryId)) {
        reportId = queryId;
      }
    }

    return reportId;
  } catch {
    return null;
  }
};
