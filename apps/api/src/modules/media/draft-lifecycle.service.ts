export type DraftStatus = "open" | "finalized" | "expired";

export type MediaDraft = {
  id: string;
  ownerId: string;
  status: DraftStatus;
  expiresAt: Date;
};

export function isDraftUsable(draft: MediaDraft, requesterId: string): boolean {
  if (draft.ownerId !== requesterId) return false;
  if (draft.status !== "open") return false;
  if (new Date() > draft.expiresAt) return false;
  return true;
}

export function finalizeDraft(draft: MediaDraft): MediaDraft {
  return { ...draft, status: "finalized" };
}

export function expireDraft(draft: MediaDraft): MediaDraft {
  return { ...draft, status: "expired" };
}

export function assertDraftUsable(draft: MediaDraft, requesterId: string): void {
  if (!isDraftUsable(draft, requesterId)) {
    const reason =
      draft.ownerId !== requesterId ? "Not the draft owner" :
      draft.status !== "open" ? `Draft is ${draft.status}` :
      "Draft has expired";
    throw Object.assign(new Error(reason), { code: "DRAFT_UNUSABLE" });
  }
}