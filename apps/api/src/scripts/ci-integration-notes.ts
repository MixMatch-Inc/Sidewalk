/**
 * ci-integration-notes.ts
 *
 * Documents the CI expansion strategy for issue #193.
 * The actual workflow changes live in .github/workflows/ci.yml.
 *
 * New jobs added to ci.yml:
 *   - stellar: lint + typecheck + build for @sidewalk/stellar
 *   - api-integration: spins up MongoDB + Redis services, runs API tests
 *
 * Local parity commands:
 *   pnpm --filter @sidewalk/stellar lint
 *   pnpm --filter @sidewalk/stellar typecheck
 *   pnpm --filter @sidewalk/stellar build
 *
 *   MONGO_URI=mongodb://localhost:27017/sidewalk_test \
 *   REDIS_URL=redis://localhost:6379 \
 *   JWT_SECRET=test \
 *   STELLAR_SECRET_KEY=test \
 *   pnpm --filter sidewalk-api test
 */

export interface CIJobConfig {
  name: string;
  services: string[];
  envVars: string[];
  commands: string[];
}

export const stellarJob: CIJobConfig = {
  name: "stellar",
  services: [],
  envVars: [],
  commands: [
    "pnpm --filter @sidewalk/stellar lint",
    "pnpm --filter @sidewalk/stellar typecheck",
    "pnpm --filter @sidewalk/stellar build",
  ],
};

export const apiIntegrationJob: CIJobConfig = {
  name: "api-integration",
  services: ["mongodb:7", "redis:7"],
  envVars: ["MONGO_URI", "REDIS_URL", "JWT_SECRET", "STELLAR_SECRET_KEY"],
  commands: [
    "pnpm --filter sidewalk-api build",
    "pnpm --filter sidewalk-api test",
  ],
};
