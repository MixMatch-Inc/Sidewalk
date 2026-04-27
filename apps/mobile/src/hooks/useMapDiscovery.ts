/**
 * useMapDiscovery.ts
 * Manages map viewport state and fetches report markers within the visible region.
 * Closes #204
 */

import { useCallback, useRef, useState } from "react";

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

export function useMapDiscovery(initialRegion: MapRegion) {
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
        lat:    String(r.latitude),
        lon:    String(r.longitude),
        latD:   String(r.latitudeDelta),
        lonD:   String(r.longitudeDelta),
      });
      const res = await globalThis.fetch(`/api/reports/map?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMarkers(await res.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRegionChangeComplete = useCallback((r: MapRegion) => {
    setRegion(r);
    fetchMarkers(r);
  }, [fetchMarkers]);

  return { region, markers, loading, error, onRegionChangeComplete };
}
