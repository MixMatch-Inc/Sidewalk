export type RequesterRole = "admin" | "agency" | "citizen";

export type MediaAccessContext = {
  requesterId: string;
  requesterRole: RequesterRole;
  reportOwnerId: string;
  assignedAgencyId?: string;
  requesterAgencyId?: string;
};

export function canAccessSecureMedia(ctx: MediaAccessContext): boolean {
  if (ctx.requesterRole === "admin") return true;
  if (ctx.requesterId === ctx.reportOwnerId) return true;
  if (
    ctx.requesterRole === "agency" &&
    ctx.assignedAgencyId &&
    ctx.requesterAgencyId === ctx.assignedAgencyId
  ) {
    return true;
  }
  return false;
}