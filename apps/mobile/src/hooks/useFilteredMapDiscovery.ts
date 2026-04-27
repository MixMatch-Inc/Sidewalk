/**
 * useFilteredMapDiscovery.ts
 * Enhanced map viewport state management with filtering support.
 */

import { useCallback, useRef, useState } from "react";
import { DiscoveryFilterState } from "../../app/components/DiscoveryFilters";

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface ReportMarker {
  id: string;
  latitude: number;
  longitude: number;
  category: string;
  status: "open" | "in_progress" | "resolved";
  title: string;
}

export function useFilteredMapDiscovery(
  initialRegion: MapRegion,
  filters: DiscoveryFilterState
) {
  const [region, setRegion] = useState<MapRegion>(initialRegion);
  const [markers, setMarkers] = useState<ReportMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetch = useRef<string>("");

  const fetchMarkers = useCallback(async (r: MapRegion) => {
    const key = `${r.latitude.toFixed(4)},${r.longitude.toFixed(4)}`;
    if (key === lastFetch.current) return;
    lastFetch.current = key;

    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        lat: String(r.latitude),
        lon: String(r.longitude),
        latD: String(r.latitudeDelta),
        lonD: String(r.longitudeDelta),
      });

      // Add category filters
      if (filters.categories.length > 0) {
        params.append('categories', filters.categories.join(','));
      }

      // Add status filters
      if (filters.statuses.length > 0) {
        params.append('statuses', filters.statuses.join(','));
      }

      // Add search text
      if (filters.searchText) {
        params.append('search', filters.searchText);
      }

      const res = await globalThis.fetch(`/api/reports/map?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMarkers(await res.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const onRegionChangeComplete = useCallback((r: MapRegion) => {
    setRegion(r);
    fetchMarkers(r);
  }, [fetchMarkers]);

  return { region, markers, loading, error, onRegionChangeComplete };
}
