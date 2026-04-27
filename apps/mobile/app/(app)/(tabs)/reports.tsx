import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
} from 'react-native';
import { authorizedApiFetch } from '../../lib/api';
import { ReportPillRow } from '../../components/report-pills';
import { useSession } from '../../providers/session-provider';
import { trackEvent } from '../../lib/analytics';
import { readCachedReportsList, writeCachedReportsList } from '../../lib/report-cache';
import { DiscoveryFilterProvider, useDiscoveryFilters, DiscoveryFilters } from '../../components/DiscoveryFilters';

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

function ReportsScreenContent() {
  const router = useRouter();
  const { accessToken } = useSession();
  const [allReports, setAllReports] = useState<MyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const { filters, hasActiveFilters } = useDiscoveryFilters();

  const loadReports = useCallback(async () => {
    if (!accessToken) {
      setAllReports([]);
      setError(null);
      setIsLoading(false);
      setIsUsingCache(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsUsingCache(false);

    try {
      const cached = await readCachedReportsList<MyReportsResponse>();
      if (cached) {
        setAllReports(cached.data.data);
        setIsUsingCache(true);
      }
    } catch {
      // Ignore cache failure, continue to network.
    }

    try {
      const payload = await authorizedApiFetch<MyReportsResponse>(
        `/api/reports/mine?page=1&pageSize=20`,
        accessToken,
      );
      setAllReports(payload.data);
      setIsUsingCache(false);
      trackEvent('reports.list.view');
      await writeCachedReportsList(payload);
    } catch (loadError) {
      if (!allReports.length) {
        setAllReports([]);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load your reports.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, allReports.length, filters]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  if (isLoading && allReports.length === 0) {
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

  if (reports.length === 0 && !isLoading) {
    const isEmptyState = allReports.length === 0;
    const hasFilters = hasActiveFilters || filters.searchText;
    
    return (
      <View style={styles.centeredState}>
        <Text style={styles.emptyTitle}>
          {hasFilters ? 'No matching reports' : 'No reports yet'}
        </Text>
        <Text style={styles.helperCopy}>
          {hasFilters 
            ? 'Try adjusting your search or filters to find what you\'re looking for.'
            : 'Reports you submit from Sidewalk will appear here once they are accepted.'
          }
        </Text>
        {!hasFilters && (
          <Pressable onPress={() => router.push('/(app)/reports/new')} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Submit a report</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // Filter and sort reports based on current filters and sort order
  const filteredReports = useMemo(() => {
    let filtered = allReports;

    // Apply search filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchLower) ||
        report.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(report => 
        filters.categories.includes(report.category)
      );
    }

    // Apply status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(report => 
        filters.statuses.includes(report.status)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return filtered;
  }, [allReports, filters, sortBy]);

  const reports = filteredReports;

  const handleRefresh = async () => {
    trackEvent('reports.list.refresh');
    await loadReports();
  };

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={reports}
      keyExtractor={(item) => item.id}
      onRefresh={handleRefresh}
      refreshing={isLoading && reports.length > 0}
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
          
          {/* Search and Filter Controls */}
          <View style={styles.controlsSection}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search reports..."
                value={filters.searchText}
                onChangeText={(text) => filters.setFilters({ searchText: text })}
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            <View style={styles.buttonRow}>
              <Pressable 
                style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
                onPress={() => setShowFilters(true)}
              >
                <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
                  Filters {hasActiveFilters && `(${filters.categories.length + filters.statuses.length})`}
                </Text>
              </Pressable>
              
              <Pressable style={styles.sortButton} onPress={() => {
                const nextSort = sortBy === 'newest' ? 'oldest' : sortBy === 'oldest' ? 'title' : 'newest';
                setSortBy(nextSort);
              }}>
                <Text style={styles.sortButtonText}>Sort: {sortBy}</Text>
              </Pressable>
            </View>
          </View>
          
          <Pressable onPress={() => router.push('/(app)/reports/new')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>New report</Text>
          </Pressable>
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

export default function ReportsScreen() {
  return (
    <DiscoveryFilterProvider>
      <ReportsScreenContent />
      <DiscoveryFilters
        visible={false}
        onClose={() => {}}
        showRadius={false}
      />
    </DiscoveryFilterProvider>
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
  controlsSection: {
    marginTop: 16,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d9d0bf',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d9d0bf',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#1f4d3f',
    borderColor: '#1f4d3f',
  },
  filterButtonText: {
    color: '#51615a',
    fontWeight: '600',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  sortButton: {
    borderWidth: 1,
    borderColor: '#d9d0bf',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  sortButtonText: {
    color: '#51615a',
    fontWeight: '600',
    fontSize: 14,
  },
});
