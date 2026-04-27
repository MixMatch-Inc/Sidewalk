export const SEED_DISTRICTS = [
  { id: "d1", name: "Lagos Island" },
  { id: "d2", name: "Ikeja" },
  { id: "d3", name: "Lekki" },
];

export const SEED_CATEGORIES = ["road_damage", "flooding", "illegal_dumping", "broken_lighting"];
export const SEED_STATUSES = ["pending", "assigned", "in_progress", "resolved"];

export const SEED_USERS = [
  { role: "admin", email: "admin@sidewalk.dev", name: "Admin User" },
  { role: "agency", email: "agency1@sidewalk.dev", name: "Agency One", agencyId: "a1", districtId: "d1" },
  { role: "agency", email: "agency2@sidewalk.dev", name: "Agency Two", agencyId: "a2", districtId: "d2" },
  { role: "citizen", email: "citizen1@sidewalk.dev", name: "Citizen One" },
  { role: "citizen", email: "citizen2@sidewalk.dev", name: "Citizen Two" },
];

export const SEED_REPORTS = SEED_DISTRICTS.flatMap((district, di) =>
  SEED_CATEGORIES.map((category, ci) => ({
    districtId: district.id,
    category,
    status: SEED_STATUSES[(di + ci) % SEED_STATUSES.length],
    title: `${category.replace(/_/g, " ")} in ${district.name}`,
    description: `Sample report for seeding: ${category} at ${district.name}.`,
    integrityFlag: (di + ci) % 3 === 0,
    exifMismatch: (di + ci) % 5 === 0,
    anchorStatus: ci % 2 === 0 ? "anchored" : "unanchored",
    anchorTxHash: ci % 2 === 0 ? `fakehash${di}${ci}abcdef` : undefined,
  })),
);