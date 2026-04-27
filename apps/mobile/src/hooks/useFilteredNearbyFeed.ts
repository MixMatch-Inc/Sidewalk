/**
 * useFilteredNearbyFeed.ts
 * Enhanced React hook that fetches nearby civic reports with filtering support.
 */

import { useCallback, useEffect, useReducer } from "react";
import { DiscoveryFilterState } from "../../app/components/DiscoveryFilters";

export interface NearbyReport {
  id: string;
  category: string;
  status: "open" | "in_progress" | "resolved";
  distanceMeters: number;
  title: string;
}

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "success"; reports: NearbyReport[] }
  | { phase: "error"; message: string };

type Action =
  | { type: "FETCH" }
  | { type: "SUCCESS"; reports: NearbyReport[] }
  | { type: "ERROR"; message: string };

function reducer(_: State, action: Action): State {
  switch (action.type) {
    case "FETCH":   return { phase: "loading" };
    case "SUCCESS": return { phase: "success", reports: action.reports };
    case "ERROR":   return { phase: "error", message: action.message };
  }
}

export function useFilteredNearbyFeed(
  lat: number | null,
  lon: number | null,
  filters: DiscoveryFilterState,
) {
  const [state, dispatch] = useReducer(reducer, { phase: "idle" });

  const fetch = useCallback(async () => {
    if (lat === null || lon === null) return;
    dispatch({ type: "FETCH" });
    
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        radius: String(filters.radiusMeters),
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

      const res = await globalThis.fetch(
        `/api/reports/nearby?${params.toString()}`,
      );
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reports: NearbyReport[] = await res.json();
      dispatch({ type: "SUCCESS", reports });
    } catch (err) {
      dispatch({ type: "ERROR", message: (err as Error).message });
    }
  }, [lat, lon, filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { state, retry: fetch };
}
