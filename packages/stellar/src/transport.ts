import { Horizon, Keypair, Networks } from "@stellar/stellar-sdk";

export type NetworkConfig = {
  horizonUrl: string;
  networkPassphrase: string;
};

const TESTNET_CONFIG: NetworkConfig = {
  horizonUrl: "https://horizon-testnet.stellar.org",
  networkPassphrase: Networks.TESTNET,
};

export class StellarTransport {
  readonly server: Horizon.Server;
  readonly keypair: Keypair;
  readonly networkPassphrase: string;

  constructor(secretKey: string, config: NetworkConfig = TESTNET_CONFIG) {
    try {
      this.keypair = Keypair.fromSecret(secretKey);
    } catch {
      throw new Error("Invalid Stellar secret key");
    }
    this.server = new Horizon.Server(config.horizonUrl);
    this.networkPassphrase = config.networkPassphrase;
  }

  get publicKey(): string {
    return this.keypair.publicKey();
  }

  async loadAccount() {
    return this.server.loadAccount(this.publicKey);
  }
}