export interface PublicReport {
  id: string;
  lat: number;
  lng: number;
  status: 'open' | 'pending' | 'resolved';
  category: string;
  shortDescription: string;
  district: string;
  createdAt: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function fetchPublicReports(
  bounds: MapBounds,
  filters?: { status?: string; category?: string; district?: string }
): Promise<PublicReport[]> {
  const params = new URLSearchParams({
    north: String(bounds.north),
    south: String(bounds.south),
    east: String(bounds.east),
    west: String(bounds.west),
    ...(filters?.status && filters.status !== 'all' ? { status: filters.status } : {}),
    ...(filters?.category && filters.category !== 'all' ? { category: filters.category } : {}),
    ...(filters?.district && filters.district !== 'all' ? { district: filters.district } : {}),
  });

  const res = await fetch(`${BASE}/api/reports/public?${params}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Map fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchPublicReportDetail(id: string): Promise<PublicReport> {
  const res = await fetch(`${BASE}/api/reports/public/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Report fetch failed: ${res.status}`);
  return res.json();
}