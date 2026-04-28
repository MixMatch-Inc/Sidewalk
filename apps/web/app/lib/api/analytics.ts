export interface AnalyticsSummary {
  totalReports: number;
  openBacklog: number;
  slaBreaches: number;
  avgResolutionDays: number;
  periodChange: number;         // % change vs previous period
}

export interface StatusBreakdown {
  status: string;
  count: number;
  pct: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  pct: number;
}

export interface DistrictRow {
  district: string;
  open: number;
  pending: number;
  resolved: number;
  slaBreaches: number;
}

export interface DailyVolume {
  date: string;   // ISO date string
  count: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  byStatus: StatusBreakdown[];
  byCategory: CategoryBreakdown[];
  byDistrict: DistrictRow[];
  dailyVolume: DailyVolume[];
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function fetchAnalytics(rangeDays: number): Promise<AnalyticsData> {
  const res = await fetch(`${BASE}/api/admin/analytics?range=${rangeDays}d`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Analytics fetch failed: ${res.status}`);
  return res.json();
}