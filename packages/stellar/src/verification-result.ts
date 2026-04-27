export type VerificationStatus = "valid" | "invalid" | "not_found" | "hash_mismatch";

export type VerificationResult = {
  status: VerificationStatus;
  txHash: string;
  onChainHash?: string;
  timestamp?: string;
  sourceAccount?: string;
  network: string;
  reason?: string;
};

export function buildVerificationResult(params: {
  txHash: string;
  expectedHash: string;
  onChainHash?: string;
  timestamp?: string;
  sourceAccount?: string;
  network?: string;
}): VerificationResult {
  const { txHash, expectedHash, onChainHash, timestamp, sourceAccount, network = "testnet" } = params;

  if (!onChainHash) {
    return { status: "not_found", txHash, network, reason: "Transaction not found on chain" };
  }
  if (onChainHash !== expectedHash) {
    return { status: "hash_mismatch", txHash, onChainHash, timestamp, sourceAccount, network, reason: "On-chain hash does not match expected value" };
  }
  return { status: "valid", txHash, onChainHash, timestamp, sourceAccount, network };
}