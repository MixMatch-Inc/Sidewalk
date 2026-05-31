import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { Horizon, Networks } from "@stellar/stellar-sdk";
import { z } from "zod";

import { readServiceEnv } from "@sidewalk/config";
import type { ApiHealth, StellarNetworkDetails } from "@sidewalk/types";
import { INTERNAL_CLAIMS_HEADER, type InternalAuthClaims } from "@sidewalk/types";
import { makeRequireAuth } from "./middleware/requireAuth.js";
import { makeWalletRouter } from "./routes/wallet.js";

const env = readServiceEnv(
  "stellar-service",
  z.object({
    PORT: z.coerce.number().default(4010),
    STELLAR_NETWORK: z.enum(["testnet", "mainnet"]).default("testnet"),
    HORIZON_URL: z.string().url().default("https://horizon-testnet.stellar.org"),
    INTERNAL_SECRET: z.string().min(16).optional()
  })
);

export const app: Express = express();
    API_INTERNAL_URL: z.string().url().default("http://localhost:4000")
  })
);

const app = express();
app.use(express.json());

// ── Trusted-caller middleware (#414) ──────────────────────────────────────────

/**
 * Parses and validates the x-internal-auth-claims header.
 * Rejects with 401 if the header is missing or malformed.
 * Rejects with 403 if the account is not verified (#413).
 */
export function requireTrustedCaller(req: Request, res: Response, next: NextFunction): void {
  const raw = req.headers[INTERNAL_CLAIMS_HEADER];
  if (!raw || typeof raw !== "string") {
    res.status(401).json({ code: "MISSING_INTERNAL_CLAIMS", message: "Internal auth claims required." });
    return;
  }

  let claims: InternalAuthClaims;
  try {
    claims = JSON.parse(raw) as InternalAuthClaims;
  } catch {
    res.status(401).json({ code: "INVALID_INTERNAL_CLAIMS", message: "Internal auth claims are malformed." });
    return;
  }

  if (typeof claims.sub !== "string" || !claims.sub || typeof claims.verified !== "boolean") {
    res.status(401).json({ code: "INVALID_INTERNAL_CLAIMS", message: "Internal auth claims are malformed." });
    return;
  }

  if (!claims.verified) {
    res.status(403).json({ code: "ACCOUNT_UNVERIFIED", message: "Account must be verified to perform this action." });
    return;
  }

  next();
}

// ── Public routes ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  const payload: ApiHealth = {
    service: "stellar-service",
    status: "ok",
    timestamp: new Date().toISOString()
  };
  res.json(payload);
  response.json(payload);
});

app.get("/network", async (_req, res, next) => {
  try {
    const server = new Horizon.Server(env.HORIZON_URL);
    const baseFee = await server.fetchBaseFee();
    const payload: StellarNetworkDetails = {
      network: env.STELLAR_NETWORK,
      horizonUrl: env.HORIZON_URL,
      networkPassphrase:
        env.STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET,
      baseFee
    };
    res.json(payload);
    response.json(payload);
  } catch (error) {
    next(error);
  }
});

// ── Protected routes (require verified account) ───────────────────────────────

/**
 * POST /wallet-intent
 * Records intent to provision a Stellar wallet for the authenticated account.
 * Requires a verified account via x-internal-auth-claims (#413).
 */
app.post("/wallet-intent", requireTrustedCaller, (req, res) => {
  const raw = req.headers[INTERNAL_CLAIMS_HEADER] as string;
  const claims = JSON.parse(raw) as InternalAuthClaims;
  res.status(202).json({ accountId: claims.sub, status: "pending" });
const requireAuth = makeRequireAuth(env.API_INTERNAL_URL);
app.use("/wallet", makeWalletRouter(requireAuth));

app.use((error: unknown, _request: express.Request, response: express.Response) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  response.status(500).json({ message });
});

// ── Error handler ─────────────────────────────────────────────────────────────

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  res.status(500).json({ message });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(env.PORT, () => {
    console.log(`@sidewalk/stellar-service listening on http://localhost:${env.PORT}`);
  });
}
