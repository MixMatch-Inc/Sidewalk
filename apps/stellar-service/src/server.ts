import express from "express";
import { Horizon, Networks } from "@stellar/stellar-sdk";
import { z } from "zod";

import { readServiceEnv } from "@sidewalk/config";
import type { ApiHealth, StellarNetworkDetails } from "@sidewalk/types";
import { makeRequireAuth } from "./middleware/requireAuth.js";
import { makeWalletRouter } from "./routes/wallet.js";

const env = readServiceEnv(
  "stellar-service",
  z.object({
    PORT: z.coerce.number().default(4010),
    STELLAR_NETWORK: z.enum(["testnet", "mainnet"]).default("testnet"),
    HORIZON_URL: z.string().url().default("https://horizon-testnet.stellar.org"),
    API_INTERNAL_URL: z.string().url().default("http://localhost:4000")
  })
);

const app = express();
app.use(express.json());

app.get("/health", (_request, response) => {
  const payload: ApiHealth = {
    service: "stellar-service",
    status: "ok",
    timestamp: new Date().toISOString()
  };
  response.json(payload);
});

app.get("/network", async (_request, response, next) => {
  try {
    const server = new Horizon.Server(env.HORIZON_URL);
    const root = await server.fetchBaseFee();
    const payload: StellarNetworkDetails = {
      network: env.STELLAR_NETWORK,
      horizonUrl: env.HORIZON_URL,
      networkPassphrase:
        env.STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET,
      baseFee: root
    };
    response.json(payload);
  } catch (error) {
    next(error);
  }
});

const requireAuth = makeRequireAuth(env.API_INTERNAL_URL);
app.use("/wallet", makeWalletRouter(requireAuth));

app.use((error: unknown, _request: express.Request, response: express.Response) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  response.status(500).json({ message });
});

app.listen(env.PORT, () => {
  console.log(`@sidewalk/stellar-service listening on http://localhost:${env.PORT}`);
});
