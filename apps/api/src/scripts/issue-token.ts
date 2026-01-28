import dotenv from "dotenv";
import { StellarService } from "@sidewalk/stellar";
import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
} from "@stellar/stellar-sdk";

dotenv.config();

const run = async () => {
  const distributorSecret = process.env.STELLAR_SECRET_KEY;
  const issuerSecret = process.env.ISSUER_SECRET_KEY;
  const assetCode = process.env.ASSET_CODE || "SIDEWALK";
  const SUPPLY = "1000000";

  if (!distributorSecret || !issuerSecret) {
    throw new Error("Missing keys in .env");
  }

  const distributorService = new StellarService(distributorSecret);
  const issuerKeypair = Keypair.fromSecret(issuerSecret);
  const server = new Horizon.Server("https://horizon-testnet.stellar.org");

  console.log(`🚀 Starting Token Issuance: ${assetCode}`);
  console.log(`Issuer: ${issuerKeypair.publicKey()}`);
  console.log(`Distributor: ${distributorService.getPublicKey()}`);

  try {
    console.log("💰 Funding Issuer account...");
    try {
      await fetch(
        `https://friendbot.stellar.org?addr=${issuerKeypair.publicKey()}`,
      );
      console.log("✅ Issuer funded.");
    } catch (e) {
      console.log("ℹ️ Issuer likely already funded.");
    }

    await distributorService.changeTrust(assetCode, issuerKeypair.publicKey());

    console.log("🖨️ Minting tokens...");

    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
    const asset = new Asset(assetCode, issuerKeypair.publicKey());

    const tx = new TransactionBuilder(issuerAccount, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: distributorService.getPublicKey(),
          asset: asset,
          amount: SUPPLY,
        }),
      )
      .setTimeout(30)
      .build();

    tx.sign(issuerKeypair);

    const result = await server.submitTransaction(tx);
    console.log(`🎉 Success! Minted ${SUPPLY} ${assetCode} to Distributor.`);
    console.log(`TX Hash: ${result.hash}`);
    console.log(
      `View on Explorer: https://stellar.expert/explorer/testnet/asset/${assetCode}-${issuerKeypair.publicKey()}`,
    );
  } catch (error: any) {
    console.error(
      "❌ Error:",
      error.response?.data?.extras?.result_codes || error.message,
    );
  }
};

run();
