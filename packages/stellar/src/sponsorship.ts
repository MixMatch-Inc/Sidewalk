import { TransactionBuilder, Networks, FeeBumpTransaction, Transaction } from "@stellar/stellar-sdk";

export type SponsorshipErrorKind = "invalid_xdr" | "already_fee_bump" | "submission_failed";

export class SponsorshipError extends Error {
  constructor(public readonly kind: SponsorshipErrorKind, message: string) {
    super(message);
    this.name = "SponsorshipError";
  }
}

export function parseInnerTransaction(xdr: string, network: string = Networks.TESTNET): Transaction {
  let tx: Transaction | FeeBumpTransaction;
  try {
    tx = TransactionBuilder.fromXDR(xdr, network);
  } catch {
    throw new SponsorshipError("invalid_xdr", "Invalid XDR: cannot parse transaction");
  }
  if (tx instanceof FeeBumpTransaction) {
    throw new SponsorshipError("already_fee_bump", "Transaction is already a fee bump");
  }
  return tx as Transaction;
}

export function wrapWithFeeBump(
  innerTx: Transaction,
  sponsorKeypair: { publicKey: () => string; sign: (tx: FeeBumpTransaction) => void },
  fee = "10000",
  network: string = Networks.TESTNET,
): FeeBumpTransaction {
  const fb = TransactionBuilder.buildFeeBumpTransaction(
    sponsorKeypair as never,
    fee,
    innerTx,
    network,
  );
  sponsorKeypair.sign(fb);
  return fb;
}