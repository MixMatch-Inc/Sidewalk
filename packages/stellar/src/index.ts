import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  Memo,
  Transaction,
  FeeBumpTransaction
} from "@stellar/stellar-sdk";

export class StellarService {
  private server: Horizon.Server;
  private keypair: Keypair;

  constructor(secretKey: string) {
    this.server = new Horizon.Server("https://horizon-testnet.stellar.org");

    try {
      this.keypair = Keypair.fromSecret(secretKey);
    } catch (error) {
      throw new Error("Invalid Stellar Secret Key provided.");
    }
  }

  getPublicKey(): string {
    return this.keypair.publicKey();
  }

  async ensureFunded(): Promise<void> {
    const publicKey = this.getPublicKey();
    console.log(`🔍 Checking funds for: ${publicKey}`);

    try {
      await this.server.loadAccount(publicKey);
      console.log("✅ Account is active and funded.");
    } catch (e: any) {
      if (e.response?.status === 404) {
        console.log("⚠️ Account not found. Asking Friendbot to fund it...");
        try {
          await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
          console.log("🎉 Account funded successfully!");
        } catch (fundError) {
          console.error("❌ Failed to fund account:", fundError);
        }
      } else {
        console.error("❌ Error checking account:", e.message);
      }
    }
  }

  async getHealth(): Promise<boolean> {
    try {
      await this.server.fetchTimebounds(10);
      return true;
    } catch (error) {
      return false;
    }
  }

  async anchorHash(dataHash: string): Promise<string> {
    console.log(`⚓ Anchoring hash: ${dataHash}`);
    const account = await this.server.loadAccount(this.getPublicKey());
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: this.getPublicKey(),
          asset: Asset.native(),
          amount: "0.00001",
        }),
      )
      .addMemo(Memo.hash(dataHash))
      .setTimeout(30)
      .build();

    tx.sign(this.keypair);

    try {
      const result = await this.server.submitTransaction(tx);
      console.log(`✅ Hash anchored! TX: ${result.hash}`);
      return result.hash;
    } catch (error: any) {
      console.error(
        "❌ Anchoring failed:",
        error.response?.data?.extras?.result_codes || error.message,
      );
      throw new Error("Failed to anchor hash on Stellar.");
    }
  }

  async sponsorTransaction(userTxXDR: string): Promise<string> {
    console.log('⛽ Wrapping transaction with Fee Sponsorship...');

    // 1. Parse the User's transaction string back into an object
    let innerTx: Transaction | FeeBumpTransaction;
    try {
      innerTx = TransactionBuilder.fromXDR(userTxXDR, Networks.TESTNET);
    } catch (e) {
      throw new Error('Invalid Transaction XDR provided');
    }

    // Ensure it's not already a fee bump
    if (innerTx instanceof FeeBumpTransaction) {
      throw new Error('Cannot sponsor a transaction that is already a fee bump');
    }

    // 2. Build the "Fee Bump" Wrapper
    // This allows the "feeSource" (Server) to pay, while preserving the "innerTx" (User's action)
    const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
      this.keypair,           // The Sponsor (Server) pays the fee
      innerTx as Transaction, // The User's original transaction
      '10000',                // Willing to pay up to 0.001 XLM (generous fee to ensure speed)
      Networks.TESTNET
    );

    // 3. Sign the Wrapper
    // The inner TX is already signed by the User. We only sign the "Bump".
    feeBumpTx.sign(this.keypair);

    // 4. Submit
    try {
      const result = await this.server.submitTransaction(feeBumpTx);
      console.log(`✅ Sponsored Transaction Sent! Outer TX: ${result.hash}`);
      return result.hash;
    } catch (error: any) {
      console.error('❌ Sponsorship Failed:', error.response?.data?.extras?.result_codes || error.message);
      throw new Error('Failed to sponsor transaction');
    }
  }
}
