// lib/api/config.ts  — matches S1-BE-23 / S2-BE-08

export interface CategoryConfig {
  id: string;
  label: string;
  enabled: boolean;
}

export interface ModerationConfig {
  autoFlagScore: number;       // 0–1
  autoRejectScore: number;     // 0–1
  slaWarningHours: number;
}

export interface SidewalkConfig {
  categories: CategoryConfig[];
  moderation: ModerationConfig;
}

export interface AuditEntry {
  actor: string;
  change: string;
  timestamp: string;
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function fetchConfig(): Promise<SidewalkConfig> {
  const res = await fetch(`${BASE}/api/admin/config`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);
  return res.json();
}

export async function saveConfig(config: SidewalkConfig): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Save failed: ${res.status}`);
  }
}

export async function fetchAuditLog(): Promise<AuditEntry[]> {
  const res = await fetch(`${BASE}/api/admin/config/audit`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export const CONFIG_DEFAULTS: SidewalkConfig = {
  categories: [
    { id: 'pothole', label: 'Pothole', enabled: true },
    { id: 'lighting', label: 'Street lighting', enabled: true },
    { id: 'graffiti', label: 'Graffiti', enabled: true },
    { id: 'drainage', label: 'Drainage', enabled: false },
    { id: 'noise', label: 'Noise complaint', enabled: false },
    { id: 'parking', label: 'Illegal parking', enabled: true },
  ],
  moderation: {
    autoFlagScore: 0.75,
    autoRejectScore: 0.95,
    slaWarningHours: 48,
  },
};