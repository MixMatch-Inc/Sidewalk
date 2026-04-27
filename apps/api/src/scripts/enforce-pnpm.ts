#!/usr/bin/env ts-node
/**
 * enforce-pnpm.ts
 * Scans the workspace for stray npm/yarn lockfiles and exits non-zero
 * if any are found. Run in CI or as a pre-commit check.
 *
 * Usage:  npx ts-node scripts/enforce-pnpm.ts
 */
import { execSync } from "child_process";
import path from "path";

const STRAY_PATTERNS = ["package-lock.json", "yarn.lock", ".yarn/cache"];

function findStray(): string[] {
  const root = path.resolve(__dirname, "../..");
  const found: string[] = [];

  for (const pattern of STRAY_PATTERNS) {
    try {
      const result = execSync(
        `find ${root} -name "${pattern}" -not -path "*/node_modules/*"`,
        { encoding: "utf8" }
      ).trim();
      if (result) found.push(...result.split("\n"));
    } catch {
      // find returns non-zero when nothing matches on some systems — ignore
    }
  }

  return found;
}

function main(): void {
  const stray = findStray();

  if (stray.length === 0) {
    console.log("✅  No stray lockfiles found. PNPM is the only lockfile.");
    process.exit(0);
  }

  console.error("❌  Stray lockfiles detected — remove them and use pnpm:\n");
  stray.forEach((f) => console.error(`   ${f}`));
  console.error(
    "\nRun `pnpm install` from the repo root and delete the files above."
  );
  process.exit(1);
}

main();
