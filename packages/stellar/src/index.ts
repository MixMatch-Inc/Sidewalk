import { Horizon } from '@stellar/stellar-sdk';

export class StellarService {
  private server: Horizon.Server;

  constructor(networkUrl: string = 'https://horizon-testnet.stellar.org') {
    this.server = new Horizon.Server(networkUrl);
    console.log(`✨ Stellar Service initialized on ${networkUrl}`);
  }

  async getHealth(): Promise<boolean> {
    try {
      await this.server.fetchTimebounds(100);
      return true;
    } catch (error) {
      console.error('Stellar connection failed', error);
      return false;
    }
  }
}
