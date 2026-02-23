import test from "node:test";
import assert from "node:assert/strict";
import { ReportModel } from "./report.model";

test("rejects invalid report coordinates when latitude is outside valid range", async () => {
  const report = new ReportModel({
    title: "Broken curb ramp",
    description: "Ramp is cracked and dangerous for wheelchair access.",
    category: "INFRASTRUCTURE",
    location: {
      type: "Point",
      coordinates: [-122.4194, 95],
    },
    media_urls: [],
  });

  await assert.rejects(
    report.validate(),
    /location\.coordinates must be \[lng, lat\] with valid ranges/,
  );
});
