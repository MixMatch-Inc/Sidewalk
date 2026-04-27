/** Locale-aware time and distance formatting utilities (issue #214) */

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

/**
 * Returns a human-readable relative time string from a timestamp.
 * Handles null/undefined safely.
 */
export function formatRelativeTime(timestamp: string | number | null | undefined): string {
  if (!timestamp) return "Unknown time";

  const now = Date.now();
  const then = new Date(timestamp).getTime();
  if (isNaN(then)) return "Invalid date";

  const diff = Math.floor((now - then) / 1000);

  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < DAY * 7) return `${Math.floor(diff / DAY)}d ago`;

  return new Date(then).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Returns a formatted absolute date/time string.
 */
export function formatAbsoluteTime(timestamp: string | number | null | undefined): string {
  if (!timestamp) return "—";
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a distance in meters to a readable string.
 * Uses km above 1000 m, otherwise meters.
 */
export function formatDistance(meters: number | null | undefined): string {
  if (meters == null || isNaN(meters)) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
