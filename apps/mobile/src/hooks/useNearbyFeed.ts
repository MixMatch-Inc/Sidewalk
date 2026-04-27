/**
 * useNearbyFeed.ts
 * React hook that fetches nearby civic reports for the mobile home feed.
 * Closes #203
 */

import { useCallback, useEffect, useReducer } from "react";

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

export function useNearbyFeed(
  lat: number | null,
  lon: number | null,
  radiusMeters = 2000,
) {
  const [state, dispatch] = useReducer(reducer, { phase: "idle" });

  const fetch = useCallback(async () => {
    if (lat === null || lon === null) return;
    dispatch({ type: "FETCH" });
    try {
      const res = await globalThis.fetch(
        `/api/reports/nearby?lat=${lat}&lon=${lon}&radius=${radiusMeters}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reports: NearbyReport[] = await res.json();
      dispatch({ type: "SUCCESS", reports });
    } catch (err) {
      dispatch({ type: "ERROR", message: (err as Error).message });
    }
  }, [lat, lon, radiusMeters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { state, retry: fetch };
}
