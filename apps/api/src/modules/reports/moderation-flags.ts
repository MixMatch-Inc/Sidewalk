export type ModerationFlagKind = "exif_mismatch" | "duplicate_suspected" | "integrity_low";

export type ModerationFlag = {
  kind: ModerationFlagKind;
  detectedAt: string;
  detail?: string;
};

export function buildModerationFlags(report: {
  integrityFlag?: boolean;
  exifMismatch?: boolean;
  duplicateSuspected?: boolean;
}): ModerationFlag[] {
  const flags: ModerationFlag[] = [];
  const now = new Date().toISOString();
  if (report.exifMismatch) flags.push({ kind: "exif_mismatch", detectedAt: now });
  if (report.duplicateSuspected) flags.push({ kind: "duplicate_suspected", detectedAt: now });
  if (report.integrityFlag) flags.push({ kind: "integrity_low", detectedAt: now });
  return flags;
}