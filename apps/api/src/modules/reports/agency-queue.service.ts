export type AgencyQueueFilter = {
  districtId: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export type AgencyQueueQuery = {
  filter: Record<string, unknown>;
  skip: number;
  limit: number;
};

export function buildAgencyQueueQuery(filter: AgencyQueueFilter): AgencyQueueQuery {
  const match: Record<string, unknown> = { districtId: filter.districtId };
  if (filter.status) match.status = filter.status;
  if (filter.category) match.category = filter.category;

  const page = Math.max(1, filter.page ?? 1);
  const limit = Math.min(filter.limit ?? 20, 100);

  return { filter: match, skip: (page - 1) * limit, limit };
}