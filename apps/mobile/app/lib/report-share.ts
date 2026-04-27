import { Share } from 'react-native';

const WEB_BASE = 'https://sidewalk.app/reports';

export interface ShareableReport {
  id: string;
  title: string;
  status: string;
  isPublic: boolean;
}

export function buildSharePayload(report: ShareableReport) {
  if (!report.isPublic) return null;
  const url = `${WEB_BASE}/${report.id}`;
  return {
    title: report.title,
    message: `${report.title} — Status: ${report.status}\n${url}`,
    url,
  };
}

export async function shareReport(report: ShareableReport): Promise<boolean> {
  const payload = buildSharePayload(report);
  if (!payload) return false;

  try {
    const result = await Share.share(
      { title: payload.title, message: payload.message, url: payload.url },
      { dialogTitle: 'Share Report' },
    );
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}

export function ReportShareButton({
  report,
  onShare,
}: {
  report: ShareableReport;
  onShare?: (shared: boolean) => void;
}) {
  const { TouchableOpacity, Text } = require('react-native');
  if (!report.isPublic) return null;
  return (
    <TouchableOpacity onPress={() => shareReport(report).then(onShare ?? (() => {}))}>
      <Text style={{ color: '#0066cc', fontWeight: '600' }}>Share</Text>
    </TouchableOpacity>
  );
}
