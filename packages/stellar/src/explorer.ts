type StellarNetwork = "testnet" | "mainnet";

const EXPLORER_BASES: Record<StellarNetwork, string> = {
  testnet: "https://stellar.expert/explorer/testnet",
  mainnet: "https://stellar.expert/explorer/public",
};

export function getExplorerBase(network: StellarNetwork = "testnet"): string {
  return EXPLORER_BASES[network];
}

export function txUrl(txHash: string, network: StellarNetwork = "testnet"): string {
  return `${getExplorerBase(network)}/tx/${txHash}`;
}

export function accountUrl(publicKey: string, network: StellarNetwork = "testnet"): string {
  return `${getExplorerBase(network)}/account/${publicKey}`;
}