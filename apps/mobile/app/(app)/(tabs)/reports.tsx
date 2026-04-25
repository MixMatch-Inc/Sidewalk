import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { authorizedApiFetch } from '../../lib/api';
import { ReportPillRow } from '../../components/report-pills';
import { useSession } from '../../providers/session-provider';

type MyReport = {
  id: string;
  title: string;
  category: string;
  status: string;
  anchorStatus: string;
  integrityFlag: string;
  createdAt: string | null;
};

type MyReportsResponse = {
  data: MyReport[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const formatCreatedAt = (value: string | null) => {
  if (!value) {
    return 'Unknown time';
  }

  return new Date(value).toLocaleString();
};

export default function ReportsScreen() {
  const router = useRouter();
  const { accessToken } = useSession();
  const [reports, setReports] = useState<MyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!accessToken) {
      setReports([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = await authorizedApiFetch<MyReportsResponse>(
        '/api/reports/mine?page=1&pageSize=20',
        accessToken,
      );
      setReports(payload.data);
    } catch (loadError) {
      setReports([]);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your reports.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color="#1f4d3f" />
        <Text style={styles.helperCopy}>Loading your reports…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorTitle}>We couldn&apos;t load your reports.</Text>
        <Text style={styles.helperCopy}>{error}</Text>
        <Pressable onPress={loadReports} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (reports.length === 0) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.emptyTitle}>No reports yet.</Text>
        <Text style={styles.helperCopy}>
          Reports you submit from Sidewalk will appear here once they are accepted.
        </Text>
        <Pressable onPress={() => router.push('/(app)/reports/new')} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Submit a report</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={reports}
      keyExtractor={(item) => item.id}
      onRefresh={() => {
        void loadReports();
      }}
      refreshing={isLoading}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/(app)/reports/${item.id}`)}
          style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
        >
          <Text style={styles.eyebrow}>{item.category}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <ReportPillRow
            items={[
              { value: item.status },
              { value: item.anchorStatus },
              { value: item.integrityFlag },
            ]}
          />
          <Text style={styles.metaText}>{formatCreatedAt(item.createdAt)}</Text>
        </Pressable>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>My Reports</Text>
          <Text style={styles.headerTitle}>Track what you have submitted.</Text>
          <Text style={styles.headerCopy}>
            Review report status, anchoring progress, and integrity alerts in one place.
          </Text>
          <Pressable onPress={() => router.push('/(app)/reports/new')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>New report</Text>
          </Pressable>
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
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
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#112219',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#112219',
    textAlign: 'center',
  },
  secondaryButton: {
    marginTop: 18,
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
  primaryButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#1f4d3f',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#f8fff8',
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    backgroundColor: '#fffaf2',
  },
  header: {
    marginBottom: 18,
  },
  headerEyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#2f5d50',
    fontWeight: '700',
  },
  headerTitle: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: '700',
    color: '#112219',
  },
  headerCopy: {
    marginTop: 10,
    color: '#405149',
    lineHeight: 22,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#ffffff',
  },
  cardPressed: {
    opacity: 0.8,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#2f5d50',
    fontWeight: '700',
  },
  cardTitle: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '700',
    color: '#112219',
  },
  metaText: {
    marginTop: 6,
    color: '#51615a',
    lineHeight: 20,
  },
  separator: {
    height: 14,
  },
});
