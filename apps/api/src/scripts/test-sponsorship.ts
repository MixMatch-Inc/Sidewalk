import dotenv from 'dotenv';
import { StellarService } from '@sidewalk/stellar';
import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  Memo,
} from '@stellar/stellar-sdk';

dotenv.config();

const run = async () => {
  const serverSecret = process.env.STELLAR_SECRET_KEY;
  if (!serverSecret) throw new Error('Missing STELLAR_SECRET_KEY');

  const stellarService = new StellarService(serverSecret);
  const server = new Horizon.Server('https://horizon-testnet.stellar.org');

  const citizenKeypair = Keypair.random();
  console.log(`👤 Citizen Account: ${citizenKeypair.publicKey()}`);

  console.log('🔹 Activating Citizen account...');
  await fetch(
    `https://friendbot.stellar.org?addr=${citizenKeypair.publicKey()}`,
  );

  console.log('📝 Citizen creating report transaction...');

  const citizenAccount = await server.loadAccount(citizenKeypair.publicKey());

  const innerTx = new TransactionBuilder(citizenAccount, {
    fee: '0', // Citizen pays nothing
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: citizenKeypair.publicKey(),
        asset: Asset.native(),
        amount: '0.00001',
      }),
    )
    .addMemo(Memo.text('Pothole Report'))
    .setTimeout(30)
    .build();

  innerTx.sign(citizenKeypair);

  const xdr = innerTx.toXDR();
  console.log('📨 Citizen sends XDR to Server...');

  try {
    const txHash = await stellarService.sponsorTransaction(xdr);
    console.log(`🎉 SUCCESS! Transaction landed on chain.`);
    console.log(`🔗 https://stellar.expert/explorer/testnet/tx/${txHash}`);
    console.log(
      'Check the explorer: The "Fee Source" will be the Server, not the Citizen.',
    );
  } catch (e) {
    console.error('Test Failed', e);
  }
};

run();
