export type AnchorStatus = "success" | "failed";

export type AnchorReceiptRecord = {
  txHash: string;
  network: string;
  submittedAt: string;
  attempts: number;
  status: AnchorStatus;
  errorMessage?: string;
};

const store = new Map<string, AnchorReceiptRecord>();

export function recordAnchorReceipt(dataHash: string, record: AnchorReceiptRecord): void {
  if (store.has(dataHash) && store.get(dataHash)!.status === "success") return;
  store.set(dataHash, record);
}

export function getAnchorReceipt(dataHash: string): AnchorReceiptRecord | undefined {
  return store.get(dataHash);
}

export function isAlreadyAnchored(dataHash: string): boolean {
  return store.get(dataHash)?.status === "success";
}

export function clearReceipts(): void {
  store.clear();
}