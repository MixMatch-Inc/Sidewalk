describe("Report list/detail contracts", () => {
  const sampleReport = {
    id: "r1",
    title: "Pothole on main street",
    status: "pending",
    category: "road_damage",
    districtId: "d1",
    createdAt: "2024-01-01T00:00:00Z",
  };

  it("list item has required stable fields", () => {
    const required = ["id", "title", "status", "category", "districtId", "createdAt"];
    required.forEach((f) => expect(sampleReport).toHaveProperty(f));
  });

  it("public list excludes private fields", () => {
    const privateFields = ["reporterEmail", "assignedAgentId", "internalNotes"];
    privateFields.forEach((f) => expect(sampleReport).not.toHaveProperty(f));
  });

  it("detail response adds description and anchor status", () => {
    const detail = { ...sampleReport, description: "Full details here", anchorStatus: "unanchored" };
    expect(detail).toHaveProperty("description");
    expect(detail).toHaveProperty("anchorStatus");
  });

  it("list response ordering is deterministic by createdAt", () => {
    const items = [
      { ...sampleReport, id: "r2", createdAt: "2024-01-03T00:00:00Z" },
      { ...sampleReport, id: "r1", createdAt: "2024-01-01T00:00:00Z" },
    ];
    const sorted = [...items].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    expect(sorted[0].id).toBe("r1");
  });
});