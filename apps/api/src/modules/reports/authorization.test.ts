function canAccessMedia(ctx: {
  requesterId: string;
  reportOwnerId: string;
  role: string;
  agencyId?: string;
  assignedAgencyId?: string;
}): boolean {
  if (ctx.requesterId === ctx.reportOwnerId) return true;
  if (ctx.role === "agency" && ctx.agencyId && ctx.agencyId === ctx.assignedAgencyId) return true;
  return false;
}

function isValidTransition(from: string, to: string): boolean {
  const allowed: Record<string, string[]> = {
    pending: ["assigned"],
    assigned: ["in_progress"],
    in_progress: ["resolved"],
    resolved: [],
  };
  return allowed[from]?.includes(to) ?? false;
}

describe("Media authorization", () => {
  it("allows report owner access", () => {
    expect(canAccessMedia({ requesterId: "u1", reportOwnerId: "u1", role: "citizen" })).toBe(true);
  });
  it("blocks unrelated agency user", () => {
    expect(canAccessMedia({ requesterId: "u2", reportOwnerId: "u1", role: "agency", agencyId: "a2", assignedAgencyId: "a1" })).toBe(false);
  });
  it("allows assigned agency user", () => {
    expect(canAccessMedia({ requesterId: "u3", reportOwnerId: "u1", role: "agency", agencyId: "a1", assignedAgencyId: "a1" })).toBe(true);
  });
});

describe("Status transitions", () => {
  it("allows pending -> assigned", () => expect(isValidTransition("pending", "assigned")).toBe(true));
  it("allows assigned -> in_progress", () => expect(isValidTransition("assigned", "in_progress")).toBe(true));
  it("blocks resolved -> pending", () => expect(isValidTransition("resolved", "pending")).toBe(false));
  it("blocks skipping stages", () => expect(isValidTransition("pending", "resolved")).toBe(false));
});