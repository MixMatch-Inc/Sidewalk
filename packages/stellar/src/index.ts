import { Horizon, Keypair } from '@stellar/stellar-sdk';

export class StellarService {
  private server: Horizon.Server;
  private keypair: Keypair;

  constructor(secretKey: string) {
    this.server = new Horizon.Server('https://horizon-testnet.stellar.org');

    try {
      this.keypair = Keypair.fromSecret(secretKey);
    } catch (error) {
      throw new Error('Invalid Stellar Secret Key provided.');
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
      console.log('✅ Account is active and funded.');
    } catch (e: any) {
      if (e.response?.status === 404) {
        console.log('⚠️ Account not found. Asking Friendbot to fund it...');
        try {
          await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
          console.log('🎉 Account funded successfully!');
        } catch (fundError) {
          console.error('❌ Failed to fund account:', fundError);
        }
      } else {
        console.error('❌ Error checking account:', e.message);
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
}
