export type OutboxEventType = "anchor_completed" | "anchor_failed";
export type OutboxStatus = "pending" | "processed";

export type OutboxEvent = {
  id: string;
  type: OutboxEventType;
  reportId: string;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  createdAt: string;
  processedAt?: string;
};

export function buildOutboxEvent(
  type: OutboxEventType,
  reportId: string,
  payload: Record<string, unknown>,
): Omit<OutboxEvent, "id"> {
  return {
    type,
    reportId,
    payload,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

export function isDuplicateCompletion(
  existing: OutboxEvent[],
  reportId: string,
  type: OutboxEventType,
): boolean {
  return existing.some(
    (e) => e.reportId === reportId && e.type === type && e.status === "processed",
  );
}