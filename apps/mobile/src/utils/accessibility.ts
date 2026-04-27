/**
 * Accessibility helpers for auth, reporting, and discovery flows (issue #213).
 * Centralises a11y labels, minimum hit-target sizes, and contrast tokens
 * so they are not duplicated per component.
 */

/** Minimum touch target size per WCAG 2.5.5 (44×44 pt) */
export const MIN_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const MIN_TOUCH_SIZE = 44;

/** Semantic labels for critical controls */
export const A11Y_LABELS = {
  submitReport: "Submit report",
  retryUpload: "Retry failed upload",
  openAttachment: "Open attachment preview",
  closePreview: "Close preview",
  signIn: "Sign in",
  signOut: "Sign out",
  sendOtp: "Send one-time password",
  verifyOtp: "Verify one-time password",
  nearbyFeed: "Nearby reports feed",
  mapView: "Map view",
} as const;

/** Contrast-safe colour tokens for status chips and buttons */
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: "#1a56db", text: "#ffffff" },
  resolved: { bg: "#057a55", text: "#ffffff" },
  pending: { bg: "#c27803", text: "#ffffff" },
  rejected: { bg: "#c81e1e", text: "#ffffff" },
};

/**
 * Returns accessible props for a pressable element.
 * Ensures label and role are always set.
 */
export function a11yButton(label: string, hint?: string) {
  return {
    accessible: true,
    accessibilityRole: "button" as const,
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : {}),
    hitSlop: MIN_HIT_SLOP,
  };
}

/**
 * Remaining accessibility debt (to be resolved in follow-up sprints):
 * - Map pins lack individual screen-reader labels
 * - OTP digit inputs need grouped accessibilityLabel
 * - Dark-mode contrast for secondary text not yet audited
 */
