import dotenv from 'dotenv';
import { StellarService } from '@sidewalk/stellar';
import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset } from '@stellar/stellar-sdk';

dotenv.config();

const run = async () => {
  const distributorSecret = process.env.STELLAR_SECRET_KEY;
  const issuerSecret = process.env.ISSUER_SECRET_KEY; // We need this just to get the Public Key
  const assetCode = process.env.ASSET_CODE || 'SIDEWALK';
  
  if (!distributorSecret || !issuerSecret) throw new Error('Missing .env keys');

  // 1. Setup
  const distributorService = new StellarService(distributorSecret);
  const issuerKeypair = Keypair.fromSecret(issuerSecret);
  const server = new Horizon.Server('https://horizon-testnet.stellar.org');

  // 2. Create a "Fake Citizen" for this test
  const citizenKeypair = Keypair.random();
  console.log(`👤 Created Dummy Citizen: ${citizenKeypair.publicKey()}`);

  // 3. Fund Citizen (Friendbot) so they can pay for the "Trust" transaction
  console.log('💰 Funding Citizen with XLM (Gas)...');
  await fetch(`https://friendbot.stellar.org?addr=${citizenKeypair.publicKey()}`);
  console.log('✅ Citizen Funded.');

  // 4. Citizen Trusts the Asset (Simulating Mobile App behavior)
  console.log('🤝 Citizen is trusting SIDEWALK...');
  const citizenAccount = await server.loadAccount(citizenKeypair.publicKey());
  const asset = new Asset(assetCode, issuerKeypair.publicKey());
  
  const trustTx = new TransactionBuilder(citizenAccount, {
    fee: '100',
    networkPassphrase: Networks.TESTNET
  })
  .addOperation(Operation.changeTrust({ asset: asset }))
  .setTimeout(30)
  .build();

  trustTx.sign(citizenKeypair);
  await server.submitTransaction(trustTx);
  console.log('✅ Trustline Established.');

  // 5. THE REAL TEST: Server sends Reward
  console.log('🏆 Server attempting to send reward...');
  
  // First, check trust (Good practice)
  const isTrusted = await distributorService.checkTrustline(
    citizenKeypair.publicKey(), 
    assetCode, 
    issuerKeypair.publicKey()
  );

  if (isTrusted) {
    const txHash = await distributorService.sendAsset(
      citizenKeypair.publicKey(), 
      '10', // Reward amount
      assetCode, 
      issuerKeypair.publicKey()
    );
    console.log(`🎉 REWARD SUCCESS! Sent 10 ${assetCode}`);
    console.log(`🔗 https://stellar.expert/explorer/testnet/tx/${txHash}`);
  } else {
    console.log('❌ Citizen does not trust the asset. Cannot pay.');
  }
};

run();