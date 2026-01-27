import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  Memo,
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

    async checkTrustline(userPublicKey: string, assetCode: string, issuerPublicKey: string): Promise<boolean> {
    try {
      const account = await this.server.loadAccount(userPublicKey);
      
      const hasTrust = account.balances.some((balance: any) => {
        return (
          balance.asset_code === assetCode && 
          balance.asset_issuer === issuerPublicKey
        );
      });

      return hasTrust;
    } catch (error) {
      return false;
    }
  }

  async sendAsset(destination: string, amount: string, assetCode: string, issuerPublicKey: string): Promise<string> {
    console.log(`Sending ${amount} ${assetCode} to ${destination}...`);

    const account = await this.server.loadAccount(this.getPublicKey());
    const asset = new Asset(assetCode, issuerPublicKey);

    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.payment({
        destination: destination,
        asset: asset,
        amount: amount
      }))
      .setTimeout(30)
      .build();

    tx.sign(this.keypair);

    try {
      const result = await this.server.submitTransaction(tx);
      console.log(`Payment Sent! TX: ${result.hash}`);
      return result.hash;
    } catch (error: any) {
      console.error('❌ Payment Failed:', error.response?.data?.extras?.result_codes || error.message);
      throw new Error('Payment failed');
    }
  }

}
