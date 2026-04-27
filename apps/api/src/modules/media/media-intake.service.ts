export type IntakeValidationResult = { valid: boolean; reason?: string };
export type MediaIntakeJob = { mediaId: string; filePath: string; mimeType: string };

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
const MAX_BYTES = 50 * 1024 * 1024;

export function validateIntake(file: { size: number; mimeType: string }): IntakeValidationResult {
  if (!ALLOWED_TYPES.includes(file.mimeType)) {
    return { valid: false, reason: `Unsupported media type: ${file.mimeType}` };
  }
  if (file.size > MAX_BYTES) {
    return { valid: false, reason: "File exceeds 50 MB limit" };
  }
  return { valid: true };
}

export function buildIntakeJob(
  mediaId: string,
  filePath: string,
  mimeType: string,
): MediaIntakeJob {
  return { mediaId, filePath, mimeType };
}