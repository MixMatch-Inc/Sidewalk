import { RefreshTokenModel } from './refresh-token.model';

export type ClientType = 'web' | 'mobile';

export interface TokenAuditMeta {
  deviceId: string;
  clientType: ClientType;
  issuedAt: Date;
  lastRotatedAt?: Date;
  revokedAt?: Date;
  revokedReason?: string;
}

/** Attach or update audit metadata on a refresh-token record. */
export async function stampTokenAudit(
  tokenId: string,
  meta: Partial<TokenAuditMeta>,
): Promise<void> {
  const update: Record<string, unknown> = {};

  if (meta.clientType) update['clientType'] = meta.clientType;
  if (meta.issuedAt) update['issuedAt'] = meta.issuedAt;
  if (meta.lastRotatedAt) update['rotatedAt'] = meta.lastRotatedAt;
  if (meta.revokedAt) update['revokedAt'] = meta.revokedAt;
  if (meta.revokedReason) update['revokedReason'] = meta.revokedReason;

  await RefreshTokenModel.updateOne({ tokenId }, { $set: update });
}

/** Return minimal audit metadata for a token — safe for internal inspection only. */
export async function getTokenAudit(tokenId: string): Promise<TokenAuditMeta | null> {
  const record = await RefreshTokenModel.findOne({ tokenId })
    .select('deviceId rotatedAt revokedAt revokedReason createdAt')
    .lean();

  if (!record) return null;

  return {
    deviceId: record.deviceId,
    clientType: 'mobile', // stored on the JWT claim; not persisted separately yet
    issuedAt: (record as unknown as { createdAt: Date }).createdAt,
    lastRotatedAt: record.rotatedAt,
    revokedAt: record.revokedAt,
    revokedReason: record.revokedReason,
  };
}

/** Purge expired tokens that were never rotated or revoked (stale cleanup). */
export async function purgeStaleTokens(): Promise<number> {
  const result = await RefreshTokenModel.deleteMany({
    status: 'ACTIVE',
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount;
}
