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

type HorizonLikeError = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      extras?: {
        result_codes?: unknown;
      };
    };
  };
};

type BalanceLike = {
  asset_code?: string;
  asset_issuer?: string;
};

const getErrorDetails = (error: unknown): HorizonLikeError => {
  if (typeof error === "object" && error !== null) {
    return error as HorizonLikeError;
  }

  return {};
};

export class StellarService {
  private server: Horizon.Server;
  private keypair: Keypair;

  constructor(secretKey: string) {
    this.server = new Horizon.Server("https://horizon-testnet.stellar.org");
    try {
      this.keypair = Keypair.fromSecret(secretKey);
    } catch {
      throw new Error("Invalid Stellar Secret Key provided.");
    }
  }

  getPublicKey(): string {
    return this.keypair.publicKey();
  }

  // 👇 ISSUE 8: New Helper for Explorer URLs
  getExplorerUrl(txHash: string): string {
    return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
  }

  async ensureFunded(): Promise<void> {
    const publicKey = this.getPublicKey();
    console.log(`🔍 Checking funds for: ${publicKey}`);
    try {
      await this.server.loadAccount(publicKey);
      console.log("✅ Account is active and funded.");
    } catch (error) {
      const details = getErrorDetails(error);

      if (details.response?.status === 404) {
        console.log("⚠️ Account not found. Asking Friendbot to fund it...");
        try {
          await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
          console.log("🎉 Account funded successfully!");
        } catch (fundError) {
          console.error("❌ Failed to fund account:", fundError);
        }
      } else {
        console.error("❌ Error checking account:", details.message);
      }
    }
  }

  async getHealth(): Promise<boolean> {
    try {
      await this.server.fetchTimebounds(10);
      return true;
    } catch {
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
    } catch (error) {
      const details = getErrorDetails(error);
      console.error(
        "❌ Anchoring failed:",
        details.response?.data?.extras?.result_codes || details.message,
      );
      throw new Error("Failed to anchor hash on Stellar.");
    }
  }

  async verifyTransaction(txHash: string, expectedHash: string): Promise<{ valid: boolean; timestamp: string; sender: string }> {
    console.log(`🔍 Verifying TX: ${txHash}`);
    try {
      const tx = await this.server.transactions().transaction(txHash).call();
      
      const memoValue = tx.memo || ''; 
      const timestamp = tx.created_at;
      
      let onChainHashHex = '';
      if (tx.memo_type === 'hash' && memoValue) {
         onChainHashHex = Buffer.from(memoValue, 'base64').toString('hex');
      } else {
         onChainHashHex = memoValue;
      }

      const isValid = (onChainHashHex === expectedHash || memoValue === expectedHash);

      return {
        valid: isValid,
        timestamp: timestamp,
        sender: tx.source_account
      };
    } catch (error) {
      const details = getErrorDetails(error);
      console.error('❌ Verification failed:', details.message);
      throw new Error('Transaction not found or network error');
    }
  }

  async changeTrust(assetCode: string, issuerPublicKey: string, limit: string = '10000000'): Promise<string> {
    console.log(`🤝 Establishing trust for ${assetCode}...`);
    const account = await this.server.loadAccount(this.getPublicKey());
    const asset = new Asset(assetCode, issuerPublicKey);

    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.changeTrust({ asset: asset, limit: limit }))
      .setTimeout(30)
      .build();

    tx.sign(this.keypair);
    const result = await this.server.submitTransaction(tx);
    return result.hash;
  }

  async checkTrustline(userPublicKey: string, assetCode: string, issuerPublicKey: string): Promise<boolean> {
    try {
      const account = await this.server.loadAccount(userPublicKey);
      return account.balances.some((balance) => {
        const typedBalance = balance as BalanceLike;
        return (
          typedBalance.asset_code === assetCode &&
          typedBalance.asset_issuer === issuerPublicKey
        );
      });
    } catch {
      return false;
    }
  }

  async sendAsset(destination: string, amount: string, assetCode: string, issuerPublicKey: string): Promise<string> {
    console.log(`💸 Sending ${amount} ${assetCode} to ${destination}...`);
    const account = await this.server.loadAccount(this.getPublicKey());
    const asset = new Asset(assetCode, issuerPublicKey);

    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.payment({ destination, asset, amount }))
      .setTimeout(30)
      .build();

    tx.sign(this.keypair);
    const result = await this.server.submitTransaction(tx);
    return result.hash;
  }

  async sponsorTransaction(userTxXDR: string): Promise<string> {
    console.log('⛽ Wrapping transaction with Fee Sponsorship...');
    let innerTx: Transaction | FeeBumpTransaction;
    try {
      innerTx = TransactionBuilder.fromXDR(userTxXDR, Networks.TESTNET);
    } catch {
      throw new Error('Invalid Transaction XDR provided');
    }

    if (innerTx instanceof FeeBumpTransaction) {
      throw new Error('Cannot sponsor a transaction that is already a fee bump');
    }

    const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
      this.keypair,
      '10000',
      innerTx as Transaction,
      Networks.TESTNET
    );

    feeBumpTx.sign(this.keypair);
    try {
      const result = await this.server.submitTransaction(feeBumpTx);
      return result.hash;
    } catch (error) {
      const details = getErrorDetails(error);
      console.error(
        '❌ Sponsorship Failed:',
        details.response?.data?.extras?.result_codes || details.message,
      );
      throw new Error('Failed to sponsor transaction');
    }
  }
}
