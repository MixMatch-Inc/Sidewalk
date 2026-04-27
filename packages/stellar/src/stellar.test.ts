import { StellarService } from "./index";

const mockKeypair = { publicKey: () => "GPUBKEY123" };
jest.mock("@stellar/stellar-sdk", () => ({
  Horizon: {
    Server: jest.fn().mockReturnValue({
      loadAccount: jest.fn(),
      fetchTimebounds: jest.fn().mockResolvedValue(true),
    }),
  },
  Keypair: { fromSecret: jest.fn().mockReturnValue(mockKeypair) },
  TransactionBuilder: jest.fn(),
  Networks: { TESTNET: "Test SDF Network ; September 2015" },
  Operation: { payment: jest.fn() },
  Asset: { native: jest.fn() },
  Memo: { hash: jest.fn() },
  Transaction: jest.fn(),
  FeeBumpTransaction: jest.fn(),
}));

describe("StellarService", () => {
  it("throws on invalid secret key", () => {
    const { Keypair } = require("@stellar/stellar-sdk");
    Keypair.fromSecret.mockImplementationOnce(() => { throw new Error("bad"); });
    expect(() => new StellarService("BADSECRET")).toThrow("Invalid Stellar Secret Key provided.");
  });

  it("returns the public key", () => {
    const svc = new StellarService("VALIDKEY");
    expect(svc.getPublicKey()).toBe("GPUBKEY123");
  });

  it("getExplorerUrl includes tx hash", () => {
    const svc = new StellarService("VALIDKEY");
    expect(svc.getExplorerUrl("abc123")).toContain("abc123");
  });

  it("getHealth returns true when Horizon is reachable", async () => {
    const svc = new StellarService("VALIDKEY");
    expect(await svc.getHealth()).toBe(true);
  });
});