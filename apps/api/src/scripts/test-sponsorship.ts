import dotenv from 'dotenv';
import { StellarService } from '@sidewalk/stellar';
import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset, Memo } from '@stellar/stellar-sdk';

dotenv.config();

const run = async () => {
  const serverSecret = process.env.STELLAR_SECRET_KEY;
  if (!serverSecret) throw new Error('Missing STELLAR_SECRET_KEY');

  const stellarService = new StellarService(serverSecret);
  const server = new Horizon.Server('https://horizon-testnet.stellar.org');

  // 1. Create a "Poor Citizen"
  const citizenKeypair = Keypair.random();
  console.log(`👤 Citizen Account: ${citizenKeypair.publicKey()}`);

  // Fund them with the BARE MINIMUM just to exist (1 XLM)
  // They won't use this for fees!
  console.log('🔹 Activating Citizen account...');
  await fetch(`https://friendbot.stellar.org?addr=${citizenKeypair.publicKey()}`);
  
  // 2. Citizen builds a transaction (e.g., Anchoring a Report)
  // NOTICE: We set `fee` to '0' because the Citizen isn't paying!
  console.log('📝 Citizen creating report transaction...');
  
  const citizenAccount = await server.loadAccount(citizenKeypair.publicKey());
  
  const innerTx = new TransactionBuilder(citizenAccount, {
    fee: '0', // <--- THE MAGIC: Citizen pays nothing
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(Operation.payment({
      destination: citizenKeypair.publicKey(), // Send to self (dummy action)
      asset: Asset.native(),
      amount: '0.00001'
    }))
    .addMemo(Memo.text('Pothole Report')) // Adding data
    .setTimeout(30)
    .build();

  // 3. Citizen Signs their intent
  innerTx.sign(citizenKeypair);
  
  // Get the XDR string (this is what the Mobile App would send to the API)
  const xdr = innerTx.toXDR();
  console.log('📨 Citizen sends XDR to Server...');

  // 4. Server Sponsors and Submits
  try {
    const txHash = await stellarService.sponsorTransaction(xdr);
    console.log(`🎉 SUCCESS! Transaction landed on chain.`);
    console.log(`🔗 https://stellar.expert/explorer/testnet/tx/${txHash}`);
    console.log('Check the explorer: The "Fee Source" will be the Server, not the Citizen.');
  } catch (e) {
    console.error('Test Failed');
  }
};

run();