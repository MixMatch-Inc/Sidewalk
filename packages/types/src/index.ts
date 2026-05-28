export * from "./auth.js";

export type ApiHealth = {
  service: "api" | "stellar-service";
  status: "ok";
  timestamp: string;
};

export type AuthStatus = {
  phase: "foundation" | "active";
  ready: boolean;
  nextStep: string;
};

export type StellarNetworkDetails = {
  network: "testnet" | "mainnet";
  horizonUrl: string;
  networkPassphrase: string;
  baseFee: number;
};
