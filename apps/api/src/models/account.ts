/**
 * Account model — MVP fields only.
 *
 * Future expansion: add `role` (citizen | agency | admin) and `stellarPublicKey`
 * once identity and Stellar layers are introduced.
 */
export type Account = {
  /** Stable surrogate key. */
  id: string;
  email: string;
  /** bcrypt hash — never serialised to clients. */
  passwordHash: string;
  /** Whether the email address has been confirmed. */
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Safe projection returned to callers — no credential fields. */
export type AccountPublic = Omit<Account, "passwordHash">;

export function toPublic(account: Account): AccountPublic {
  const { passwordHash: _pw, ...pub } = account;
  return pub;
}
