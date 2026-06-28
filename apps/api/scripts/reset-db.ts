/**
 * Reset the local development database.
 *
 * Usage:
 *   pnpm --filter @sidewalk/api db:reset          # wipe + recreate schema
 *   pnpm --filter @sidewalk/api db:reset --seed   # wipe + schema + seed
 */
import { execSync } from "child_process";
import { existsSync, unlinkSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(__dirname, "..");

// Resolve the SQLite file path from DATABASE_URL env var
const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const match = dbUrl.match(/^file:(.+)$/);
if (!match) {
  console.error("reset-db only supports SQLite (file: URLs)");
  process.exit(1);
}

const dbPath = resolve(apiRoot, match[1]);

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
  console.log(`🗑  Deleted ${dbPath}`);
}

console.log("🔄 Recreating schema with prisma db push…");
execSync("pnpm exec prisma db push --force-reset --skip-generate", {
  cwd: apiRoot,
  stdio: "inherit",
});

const withSeed = process.argv.includes("--seed") || process.argv.includes("--with-seed");
if (withSeed) {
  console.log("🌱 Running seed…");
  execSync("pnpm exec prisma db seed", { cwd: apiRoot, stdio: "inherit" });
}

console.log("✅ Database reset complete");
