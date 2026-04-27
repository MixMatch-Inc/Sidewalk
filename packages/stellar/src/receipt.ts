export type AnchorReceipt = {
  txHash: string;
  network: "testnet" | "mainnet";
  explorerUrl: string;
  submittedAt: string;
  memoHash: string;
};

const EXPLORER: Record<"testnet" | "mainnet", string> = {
  testnet: "https://stellar.expert/explorer/testnet",
  mainnet: "https://stellar.expert/explorer/public",
};

export function buildAnchorReceipt(
  txHash: string,
  memoHash: string,
  network: "testnet" | "mainnet" = "testnet",
  submittedAt = new Date().toISOString(),
): AnchorReceipt {
  return {
    txHash,
    network,
    explorerUrl: `${EXPLORER[network]}/tx/${txHash}`,
    submittedAt,
    memoHash,
  };
}