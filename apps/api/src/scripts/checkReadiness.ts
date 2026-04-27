/**
 * Startup readiness check that mirrors the Sprint 1 demo runbook.
 * Prints service status so a new contributor can verify their local setup.
 * Closes #198
 */

import http from "http";

interface ServiceCheck {
  name: string;
  url: string;
  required: boolean;
}

const CHECKS: ServiceCheck[] = [
  { name: "API health", url: "http://localhost:3001/health", required: true },
  { name: "Web app", url: "http://localhost:3000", required: true },
  { name: "Mongo (via API)", url: "http://localhost:3001/health/db", required: true },
  { name: "Redis (via API)", url: "http://localhost:3001/health/queue", required: false },
];

function probe(url: string): Promise<number> {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => resolve(res.statusCode ?? 0));
    req.on("error", () => resolve(0));
    req.setTimeout(2000, () => { req.destroy(); resolve(0); });
  });
}

async function runChecks(): Promise<void> {
  console.log("\n=== Sidewalk Sprint 1 – local readiness check ===\n");

  let allRequired = true;

  for (const svc of CHECKS) {
    const status = await probe(svc.url);
    const ok = status >= 200 && status < 400;
    const tag = ok ? "✓" : svc.required ? "✗" : "–";
    const note = ok ? `HTTP ${status}` : svc.required ? "UNREACHABLE (required)" : "unreachable (optional)";
    console.log(`  ${tag}  ${svc.name.padEnd(22)} ${note}`);
    if (!ok && svc.required) allRequired = false;
  }

  console.log();
  if (allRequired) {
    console.log("All required services are up. Run the demo runbook at docs/phase-1-demo-runbook.md");
  } else {
    console.log("Some required services are down. Check pnpm dev:api and pnpm dev:web.");
    process.exit(1);
  }
}

runChecks();
