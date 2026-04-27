export type TimelineEventType =
  | "report_created"
  | "status_updated"
  | "comment_added"
  | "anchor_completed"
  | "anchor_failed";

export type TimelineEvent = {
  type: TimelineEventType;
  occurredAt: string;
  payload: Record<string, unknown>;
  internal: boolean;
};

export function buildTimeline(
  events: TimelineEvent[],
  includeInternal = false,
): TimelineEvent[] {
  return events
    .filter((e) => includeInternal || !e.internal)
    .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
}