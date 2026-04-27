import { StellarService } from "@sidewalk/stellar";

const SECRET = process.env.STELLAR_SECRET_KEY ?? "";

async function smokeAnchor() {
  const svc = new StellarService(SECRET);
  await svc.ensureFunded();
  const txHash = await svc.anchorHash(
    "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
  );
  console.log("anchor tx:", txHash);
  return txHash;
}

async function smokeVerify(txHash: string, expectedHash: string) {
  const svc = new StellarService(SECRET);
  const result = await svc.verifyTransaction(txHash, expectedHash);
  console.log("verify result:", result);
}

async function smokeTrustline(assetCode: string, issuer: string) {
  const svc = new StellarService(SECRET);
  const txHash = await svc.changeTrust(assetCode, issuer);
  console.log("trustline tx:", txHash);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "anchor") smokeAnchor().catch(console.error);
else if (cmd === "verify") smokeVerify(args[0], args[1]).catch(console.error);
else if (cmd === "trustline") smokeTrustline(args[0], args[1]).catch(console.error);
else console.log("Usage: ts-node stellar-smoke.ts <anchor|verify|trustline> [args]");