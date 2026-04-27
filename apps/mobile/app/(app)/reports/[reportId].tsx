import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { authorizedApiFetch } from '../../lib/api';
import { ReportPillRow } from '../../components/report-pills';
import { useReportDeepLink } from '../../lib/use-report-deep-link';
import { useSession } from '../../providers/session-provider';
import {
  readCachedReportDetail,
  writeCachedReportDetail,
} from '../../lib/report-cache';
import { trackEvent } from '../../lib/analytics';

type ReportDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  anchor_status: string;
  anchor_attempts: number;
  anchor_last_error: string | null;
  integrity_flag: string;
  exif_verified: boolean;
  exif_distance_meters: number | null;
  stellar_tx_hash: string | null;
  snapshot_hash: string | null;
  created_at: string | null;
  updated_at: string | null;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  media_urls: string[];
  history: {
    type: string;
    status: string;
    note: string | null;
    createdAt: string | null;
  }[];
};

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : 'Not available';

const formatCoordinates = (coordinates: [number, number]) => {
  const [longitude, latitude] = coordinates;
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
};

export default function ReportDetailScreen() {
  const { reportId, justSubmitted, anchorStatus } = useLocalSearchParams<{
    reportId: string;
    justSubmitted?: string;
    anchorStatus?: string;
  }>();
  const deepLinkState = useReportDeepLink(reportId);
  const { accessToken } = useSession();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [cachedTimestamp, setCachedTimestamp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolvedReportId =
    deepLinkState.status === 'ready' ? deepLinkState.reportId : reportId;

  const loadReport = useCallback(async () => {
    if (!accessToken || !resolvedReportId) {
      setReport(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsUsingCache(false);
    setCachedTimestamp(null);

    let wasCached = false;
    let hasReport = false;

    try {
      const cached = await readCachedReportDetail<ReportDetail>(resolvedReportId);
      if (cached) {
        setReport(cached.data);
        setIsUsingCache(true);
        setCachedTimestamp(cached.timestamp);
        wasCached = true;
        hasReport = true;
      }
    } catch {
      // Ignore cache read failures and continue with network fetch.
    }

    try {
      const payload = await authorizedApiFetch<ReportDetail>(`/api/reports/${resolvedReportId}`, accessToken);
      setReport(payload);
      setIsUsingCache(false);
      setCachedTimestamp(null);
      hasReport = true;
      await writeCachedReportDetail(resolvedReportId, payload);
      trackEvent('reports.detail.view', {
        source: wasCached ? 'cache_then_network' : 'network',
      });
    } catch (loadError) {
      if (!hasReport) {
        setReport(null);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load report.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, resolvedReportId]);

  useEffect(() => {
    if (deepLinkState.status === 'invalid') {
      setIsLoading(false);
      setError(null);
      return;
    }

    void loadReport();
  }, [deepLinkState.status, loadReport]);

  if (deepLinkState.status === 'invalid') {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorTitle}>Invalid report link</Text>
        <Text style={styles.helperCopy}>{deepLinkState.reason}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color="#1f4d3f" />
        <Text style={styles.helperCopy}>Loading report…</Text>
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorTitle}>We couldn&apos;t load this report.</Text>
        <Text style={styles.helperCopy}>{error ?? 'The report could not be found.'}</Text>
        {isUsingCache ? (
          <Text style={styles.helperText}>Showing cached data from {cachedTimestamp}.</Text>
        ) : null}
        <Pressable onPress={loadReport} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const handleShareReport = async () => {
    if (!report) {
      return;
    }

    try {
      const publicUrl = `https://sidewalk.org/reports/${report.id}`;
      await Share.share({
        message: `Check out this Sidewalk report: "${report.title}" - ${publicUrl}`,
        url: publicUrl,
        title: report.title,
      });

      trackEvent('reports.detail.share', {
        reportId: report.id.slice(0, 8),
      });
    } catch {
      // User cancelled share or error occurred; silently fail.
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isUsingCache && cachedTimestamp ? (
        <View style={styles.cacheWarning}>
          <Text style={styles.cacheWarningText}>
            Showing cached data from {new Date(cachedTimestamp).toLocaleTimeString()}. Pull to refresh.
          </Text>
        </View>
      ) : null}
      <Pressable onPress={handleShareReport} style={styles.shareButton}>
        <Text style={styles.shareButtonText}>Share Report</Text>
      </Pressable>
      <Text style={styles.eyebrow}>{report.category}</Text>
      <Text style={styles.title}>{report.title}</Text>
      {justSubmitted === '1' ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Report accepted</Text>
          <Text style={styles.noticeText}>
            {anchorStatus === 'ANCHOR_QUEUED'
              ? 'Your report was accepted and blockchain anchoring is now queued.'
              : 'Your report was accepted successfully.'}
          </Text>
        </View>
      ) : null}
      <ReportPillRow
        items={[
          { value: report.status },
          { value: report.anchor_status },
          { value: report.integrity_flag },
        ]}
      />
      <Text style={styles.description}>{report.description}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Location & Timing</Text>
        <Text style={styles.cardText}>Coordinates: {formatCoordinates(report.location.coordinates)}</Text>
        <Text style={styles.cardText}>Created: {formatDateTime(report.created_at)}</Text>
        <Text style={styles.cardText}>Updated: {formatDateTime(report.updated_at)}</Text>
        <Text style={styles.cardText}>
          EXIF verified: {report.exif_verified ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.cardText}>
          EXIF distance: {report.exif_distance_meters ?? 'Not available'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Anchor Metadata</Text>
        <Text style={styles.cardText}>Anchor status: {report.anchor_status}</Text>
        <Text style={styles.cardText}>Anchor attempts: {report.anchor_attempts}</Text>
        <Text style={styles.cardText}>
          Snapshot hash: {report.snapshot_hash ?? 'Pending'}
        </Text>
        <Text style={styles.cardText}>
          Transaction hash: {report.stellar_tx_hash ?? 'Pending'}
        </Text>
        {report.anchor_last_error ? (
          <Text style={styles.warningText}>Last anchor error: {report.anchor_last_error}</Text>
        ) : null}
        {report.stellar_tx_hash ? (
          <Pressable
            onPress={() =>
              void Linking.openURL(`https://stellar.expert/explorer/testnet/tx/${report.stellar_tx_hash}`)
            }
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Open Stellar Explorer</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Media</Text>
        {report.media_urls.length === 0 ? (
          <Text style={styles.cardText}>No media attached to this report yet.</Text>
        ) : (
          report.media_urls.map((url) => (
            <Text key={url} style={styles.mediaUrl}>
              {url}
            </Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>History</Text>
        {report.history.length === 0 ? (
          <Text style={styles.cardText}>No status updates yet.</Text>
        ) : (
          report.history.map((entry, index) => (
            <View key={`${entry.type}-${entry.status}-${entry.createdAt}-${index}`} style={styles.historyRow}>
              <Text style={styles.historyStatus}>{entry.status}</Text>
              <Text style={styles.cardText}>{entry.note ?? entry.type}</Text>
              <Text style={styles.historyTime}>{formatDateTime(entry.createdAt)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fffaf2',
  },
  helperCopy: {
    marginTop: 12,
    color: '#51615a',
    lineHeight: 22,
    textAlign: 'center',
  },
  helperText: {
    marginTop: 8,
    color: '#51615a',
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#112219',
    textAlign: 'center',
  },
  container: {
    padding: 24,
    backgroundColor: '#fffaf2',
    gap: 16,
  },
  cacheWarning: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#fff3cd',
  },
  cacheWarningText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  shareButton: {
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#1f4d3f',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  shareButtonText: {
    color: '#f8fff8',
    fontWeight: '700',
    fontSize: 14,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#2f5d50',
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#112219',
  },
  description: {
    color: '#1e2c26',
    lineHeight: 24,
  },
  noticeCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#e7f4ee',
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#173d31',
  },
  noticeText: {
    marginTop: 6,
    color: '#1f4d3f',
    lineHeight: 21,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#112219',
  },
  cardText: {
    color: '#51615a',
    lineHeight: 21,
  },
  warningText: {
    color: '#a13a29',
    lineHeight: 21,
  },
  historyRow: {
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e6e1d7',
  },
  historyStatus: {
    fontWeight: '700',
    color: '#173d31',
  },
  historyTime: {
    color: '#7a8a84',
    fontSize: 13,
  },
  mediaUrl: {
    color: '#1f4d3f',
    lineHeight: 21,
  },
  secondaryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#cad5cf',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#173d31',
    fontWeight: '700',
  },
});
