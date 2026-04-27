export type AnchorErrorKind =
  | "transient_network"
  | "account_config"
  | "invalid_hash"
  | "submission_rejected"
  | "unknown";

export class AnchorError extends Error {
  constructor(
    public readonly kind: AnchorErrorKind,
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "AnchorError";
  }
}

export function classifyAnchorError(error: unknown): AnchorError {
  const e = error as {
    response?: { status?: number; data?: { extras?: { result_codes?: { transaction?: string } } } };
  };
  const status = e?.response?.status;
  const code = e?.response?.data?.extras?.result_codes?.transaction;

  if (!status || status >= 500) {
    return new AnchorError("transient_network", "Horizon unreachable or server error", true);
  }
  if (code === "tx_bad_auth") {
    return new AnchorError("account_config", "Bad authentication on transaction", false);
  }
  if (code === "tx_bad_seq") {
    return new AnchorError("invalid_hash", "Bad sequence number", true);
  }
  if (status === 400) {
    return new AnchorError("submission_rejected", "Transaction rejected by Horizon", false);
  }
  return new AnchorError("unknown", "Unclassified anchor error", false);
}