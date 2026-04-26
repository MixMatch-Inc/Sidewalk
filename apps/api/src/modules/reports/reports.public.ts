import { ReportModel } from './report.model';
import { PublicReportListQueryDTO } from './reports.schemas';

/** Fields safe to expose on the public listing endpoint. */
const PUBLIC_PROJECTION = {
  _id: 1,
  title: 1,
  category: 1,
  status: 1,
  location: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

export interface PublicReportItem {
  id: string;
  title: string;
  category: string;
  status: string;
  location: { type: 'Point'; coordinates: [number, number] };
  createdAt: string;
  updatedAt: string;
}

export interface PublicReportPage {
  data: PublicReportItem[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Fetch a paginated, field-restricted list of public reports.
 * Strips owner identifiers, internal comments, and media metadata.
 */
export async function listPublicReports(
  query: PublicReportListQueryDTO,
): Promise<PublicReportPage> {
  const { page, pageSize, status, category } = query;
  const filter: Record<string, unknown> = {};

  if (status) filter['status'] = status;
  if (category) filter['category'] = category;

  const [docs, total] = await Promise.all([
    ReportModel.find(filter)
      .select(PUBLIC_PROJECTION)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    ReportModel.countDocuments(filter),
  ]);

  const data: PublicReportItem[] = docs.map((d) => ({
    id: String(d._id),
    title: d.title,
    category: d.category,
    status: d.status,
    location: d.location as PublicReportItem['location'],
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return { data, page, pageSize, total };
}
