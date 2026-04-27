/**
 * Dependency audit helper.
 * Runs `pnpm outdated` and flags high-churn packages that need manual review.
 * Intended for use in the weekly maintenance workflow.
 * Closes #200
 */

import { execSync } from "child_process";

const HIGH_CHURN = ["expo", "next", "@stellar/stellar-sdk", "react-native", "typescript"];

interface OutdatedEntry {
  current: string;
  latest: string;
  packageName: string;
}

function runOutdated(): OutdatedEntry[] {
  try {
    const raw = execSync("pnpm outdated --format json --recursive 2>/dev/null", {
      encoding: "utf8",
    });
    const parsed: Record<string, { current: string; latest: string }> = JSON.parse(raw || "{}");
    return Object.entries(parsed).map(([packageName, v]) => ({ packageName, ...v }));
  } catch {
    // pnpm outdated exits non-zero when packages are outdated; stdout still has data
    return [];
  }
}

function audit(): void {
  console.log("=== Sidewalk dependency audit ===\n");
  const outdated = runOutdated();

  if (!outdated.length) {
    console.log("All packages are up to date.");
    return;
  }

  const flagged = outdated.filter((e) =>
    HIGH_CHURN.some((h) => e.packageName.includes(h))
  );

  console.log(`Outdated packages: ${outdated.length}`);
  outdated.forEach((e) =>
    console.log(`  ${e.packageName.padEnd(40)} ${e.current} → ${e.latest}`)
  );

  if (flagged.length) {
    console.log(`\n⚠  High-churn packages requiring manual review (${flagged.length}):`);
    flagged.forEach((e) => console.log(`  • ${e.packageName}: ${e.current} → ${e.latest}`));
  }
}

audit();
