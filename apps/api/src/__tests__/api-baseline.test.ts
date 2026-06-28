import { describe, it, expect } from "vitest";

function paginate<T>(items: T[], page: number, size: number): T[] {
  return items.slice((page - 1) * size, page * size);
}

function buildListResponse<T>(items: T[], total: number, page: number, size: number) {
  return { data: items, meta: { total, page, size, pages: Math.ceil(total / size) } };
}

describe("API baseline — list endpoint helpers", () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }));

  it("paginates to correct slice", () => {
    expect(paginate(items, 2, 10)[0].id).toBe("11");
  });

  it("last page returns remaining items", () => {
    expect(paginate(items, 3, 10).length).toBe(5);
  });

  it("buildListResponse includes correct meta", () => {
    const res = buildListResponse(paginate(items, 1, 10), 25, 1, 10);
    expect(res.meta.pages).toBe(3);
    expect(res.meta.total).toBe(25);
  });
});
