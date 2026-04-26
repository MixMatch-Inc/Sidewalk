/** Lightweight duplicate-report detection signals (issue #160). Non-blocking advisory only. */

import { ReportModel } from './report.model';

const PROXIMITY_METERS = 200;
const TIME_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 h

export interface DuplicateCandidate {
  reportId: string;
  score: number; // 0–1, higher = more likely duplicate
}

export interface DuplicateSignals {
  candidates: DuplicateCandidate[];
  hasPotentialDuplicates: boolean;
}

/**
 * Compute non-blocking duplicate hints for a new report.
 * Checks proximity, recency, and category overlap.
 * Never throws — returns empty signals on error so creation is never blocked.
 */
export async function computeDuplicateSignals(params: {
  lng: number;
  lat: number;
  category: string;
  createdAt?: Date;
}): Promise<DuplicateSignals> {
  try {
    const since = new Date(Date.now() - TIME_WINDOW_MS);
    const nearby = await ReportModel.find({
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [params.lng, params.lat] },
          $maxDistance: PROXIMITY_METERS,
        },
      },
      createdAt: { $gte: since },
    })
      .select({ _id: 1, category: 1 })
      .limit(10)
      .lean();

    const candidates: DuplicateCandidate[] = nearby.map((doc) => {
      const categoryMatch = doc.category === params.category ? 0.5 : 0;
      return { reportId: String(doc._id), score: 0.5 + categoryMatch };
    });

    return { candidates, hasPotentialDuplicates: candidates.length > 0 };
  } catch {
    return { candidates: [], hasPotentialDuplicates: false };
  }
}
