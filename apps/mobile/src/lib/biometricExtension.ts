/**
 * Architecture hook for future biometric re-entry (#381).
 *
 * This module defines WHERE biometric unlock plugs into the mobile auth
 * lifecycle. No biometric logic ships yet — the interface is the contract.
 *
 * Extension path:
 *   1. Install `expo-local-authentication`.
 *   2. Implement `BiometricProvider` using `LocalAuthentication.authenticateAsync`.
 *   3. Call `setBiometricProvider(provider)` at app startup.
 *   4. Call `promptBiometricReentry()` when re-auth is needed (e.g. after
 *      app foreground, before sensitive operations).
 *
 * Current session bootstrap and storage decisions (see secureStorage.ts) are
 * designed so biometric unlock can gate token retrieval without changing the
 * storage interface.
 */

export type BiometricResult =
  | { success: true }
  | { success: false; reason: "cancelled" | "failed" | "unavailable" };

export interface BiometricProvider {
  isAvailable(): Promise<boolean>;
  prompt(reason: string): Promise<BiometricResult>;
}

let provider: BiometricProvider | null = null;

/** Register the biometric implementation at app startup. */
export function setBiometricProvider(p: BiometricProvider): void {
  provider = p;
}

/**
 * Prompt for biometric re-entry.
 * Returns `{ success: false, reason: "unavailable" }` when no provider is
 * registered — callers must handle this gracefully (fall back to password).
 */
export async function promptBiometricReentry(
  reason = "Confirm your identity to continue"
): Promise<BiometricResult> {
  if (!provider) return { success: false, reason: "unavailable" };
  const available = await provider.isAvailable();
  if (!available) return { success: false, reason: "unavailable" };
  return provider.prompt(reason);
}
