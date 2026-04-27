export type StellarConfig = {
  networkPassphrase: string;
  horizonUrl: string;
  explorerBaseUrl: string;
  baseFee: string;
  timeoutSeconds: number;
};

const TESTNET_DEFAULTS: StellarConfig = {
  networkPassphrase: "Test SDF Network ; September 2015",
  horizonUrl: "https://horizon-testnet.stellar.org",
  explorerBaseUrl: "https://stellar.expert/explorer/testnet",
  baseFee: "100",
  timeoutSeconds: 30,
};

export function loadStellarConfig(env: NodeJS.ProcessEnv = process.env): StellarConfig {
  return {
    networkPassphrase: env.STELLAR_NETWORK_PASSPHRASE ?? TESTNET_DEFAULTS.networkPassphrase,
    horizonUrl: env.STELLAR_HORIZON_URL ?? TESTNET_DEFAULTS.horizonUrl,
    explorerBaseUrl: env.STELLAR_EXPLORER_BASE_URL ?? TESTNET_DEFAULTS.explorerBaseUrl,
    baseFee: env.STELLAR_BASE_FEE ?? TESTNET_DEFAULTS.baseFee,
    timeoutSeconds: Number(env.STELLAR_TIMEOUT_SECONDS ?? TESTNET_DEFAULTS.timeoutSeconds),
  };
}

export function validateStellarConfig(config: StellarConfig): void {
  if (!config.horizonUrl) throw new Error("STELLAR_HORIZON_URL is required");
  if (!config.networkPassphrase) throw new Error("STELLAR_NETWORK_PASSPHRASE is required");
  if (isNaN(config.timeoutSeconds) || config.timeoutSeconds <= 0) {
    throw new Error("STELLAR_TIMEOUT_SECONDS must be a positive number");
  }
}