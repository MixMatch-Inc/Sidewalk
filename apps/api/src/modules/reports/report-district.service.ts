/** Derive and persist district on report creation from authenticated user context (issue #159). */

export interface UserDistrictContext {
  district?: string | null;
}

export type DistrictResolution =
  | { resolved: true; district: string }
  | { resolved: false; reason: 'missing_from_user' };

/**
 * Derive district from the authenticated user's profile.
 * Does NOT infer from coordinates — geocoding is a deliberate future addition.
 */
export function deriveDistrict(user: UserDistrictContext): DistrictResolution {
  if (user.district) {
    return { resolved: true, district: user.district };
  }
  return { resolved: false, reason: 'missing_from_user' };
}

/**
 * Resolve district for a new report payload.
 * Returns the district string when available, null otherwise.
 * Callers should log or surface the reason when unresolved.
 */
export function resolveReportDistrict(
  user: UserDistrictContext,
  onUnresolved?: (reason: string) => void,
): string | null {
  const result = deriveDistrict(user);
  if (result.resolved) return result.district;
  onUnresolved?.(result.reason);
  return null;
}

/** Apply district to a mutable report creation payload in-place. */
export function applyDistrictToPayload(
  payload: Record<string, unknown>,
  user: UserDistrictContext,
  onUnresolved?: (reason: string) => void,
): void {
  payload['district'] = resolveReportDistrict(user, onUnresolved);
}
