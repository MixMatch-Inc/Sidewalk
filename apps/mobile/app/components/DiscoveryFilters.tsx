import React, { useCallback, useContext, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';

export interface DiscoveryFilterState {
  categories: string[];
  statuses: string[];
  radiusMeters: number;
  searchText?: string;
}

const DEFAULT_RADIUS_OPTIONS = [500, 1000, 2000, 5000];
const DEFAULT_STATUSES = ['open', 'in_progress', 'resolved'];
const DEFAULT_CATEGORIES = ['pothole', 'street_light', 'garbage', 'noise', 'water', 'other'];

type FilterContextType = {
  filters: DiscoveryFilterState;
  setFilters: (filters: Partial<DiscoveryFilterState>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
};

const FilterContext = React.createContext<FilterContextType | null>(null);

export function useDiscoveryFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useDiscoveryFilters must be used within DiscoveryFilterProvider');
  }
  return context;
}

export function DiscoveryFilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<DiscoveryFilterState>({
    categories: [],
    statuses: [],
    radiusMeters: 2000,
    searchText: '',
  });

  const setFilters = useCallback((newFilters: Partial<DiscoveryFilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({
      categories: [],
      statuses: [],
      radiusMeters: 2000,
      searchText: '',
    });
  }, []);

  const hasActiveFilters = Boolean(
    filters.categories.length > 0 ||
    filters.statuses.length > 0 ||
    filters.searchText ||
    filters.radiusMeters !== 2000
  );

  return (
    <FilterContext.Provider value={{ filters, setFilters, clearFilters, hasActiveFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

function FilterChip({ label, isSelected, onPress }: FilterChipProps) {
  return (
    <Pressable
      style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

interface DiscoveryFiltersProps {
  visible: boolean;
  onClose: () => void;
  categories?: string[];
  statuses?: string[];
  radiusOptions?: number[];
  showSearch?: boolean;
  showRadius?: boolean;
}

export function DiscoveryFilters({
  visible,
  onClose,
  categories = DEFAULT_CATEGORIES,
  statuses = DEFAULT_STATUSES,
  radiusOptions = DEFAULT_RADIUS_OPTIONS,
  showSearch = true,
  showRadius = true,
}: DiscoveryFiltersProps) {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useDiscoveryFilters();

  if (!visible) return null;

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    setFilters({ categories: newCategories });
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    setFilters({ statuses: newStatuses });
  };

  const handleClearAll = () => {
    clearFilters();
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.closeButton}>Done</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {showSearch && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search</Text>
              <Text style={styles.searchInput}>{filters.searchText || 'Tap to search...'}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.chipContainer}>
              {categories.map(category => (
                <FilterChip
                  key={category}
                  label={category.replace('_', ' ').toUpperCase()}
                  isSelected={filters.categories.includes(category)}
                  onPress={() => toggleCategory(category)}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.chipContainer}>
              {statuses.map(status => (
                <FilterChip
                  key={status}
                  label={status.replace('_', ' ').toUpperCase()}
                  isSelected={filters.statuses.includes(status)}
                  onPress={() => toggleStatus(status)}
                />
              ))}
            </View>
          </View>

          {showRadius && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Radius</Text>
              <View style={styles.chipContainer}>
                {radiusOptions.map(radius => (
                  <FilterChip
                    key={radius}
                    label={`${radius}m`}
                    isSelected={filters.radiusMeters === radius}
                    onPress={() => setFilters({ radiusMeters: radius })}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {hasActiveFilters && (
            <Pressable style={styles.clearButton} onPress={handleClearAll}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#112219',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f4d3f',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#112219',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: '#1f4d3f',
    borderColor: '#1f4d3f',
  },
  chipUnselected: {
    backgroundColor: '#ffffff',
    borderColor: '#d9d0bf',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  chipTextUnselected: {
    color: '#51615a',
  },
  searchInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#d9d0bf',
    borderRadius: 12,
    color: '#51615a',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  clearButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9d0bf',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#51615a',
    fontWeight: '600',
  },
});
