import { ReportModel } from './report.model';
import { ReportsMapQueryDTO } from './reports.schemas';

/** Minimal shape returned for each pin on the map. */
export interface MapReportPin {
  id: string;
  title: string;
  category: string;
  status: string;
  coordinates: [number, number]; // [lng, lat]
}

const MAP_PROJECTION = { _id: 1, title: 1, category: 1, status: 1, location: 1 } as const;

function isRadiusQuery(q: ReportsMapQueryDTO): q is { lat: number; lng: number; radiusInMeters: number } {
  return 'radiusInMeters' in q;
}

/**
 * Execute a map query using either radius (near-sphere) or bounding-box mode.
 * Returns map-friendly pin summaries only — no owner or media data.
 */
export async function queryMapReports(query: ReportsMapQueryDTO): Promise<MapReportPin[]> {
  let mongoFilter: Record<string, unknown>;

  if (isRadiusQuery(query)) {
    mongoFilter = {
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [query.lng, query.lat] },
          $maxDistance: query.radiusInMeters,
        },
      },
    };
  } else {
    mongoFilter = {
      location: {
        $geoWithin: {
          $box: [
            [query.minLng, query.minLat],
            [query.maxLng, query.maxLat],
          ],
        },
      },
    };
  }

  const docs = await ReportModel.find(mongoFilter)
    .select(MAP_PROJECTION)
    .limit(500)
    .lean();

  return docs.map((d) => ({
    id: String(d._id),
    title: d.title,
    category: d.category,
    status: d.status,
    coordinates: d.location.coordinates as [number, number],
  }));
}
