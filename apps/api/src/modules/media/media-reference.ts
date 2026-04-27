export type ProcessingStatus = "pending" | "ready" | "failed";

export type MediaReference = {
  id: string;
  mimeType: string;
  processingStatus: ProcessingStatus;
  securePreviewCapable: boolean;
  url?: string;
};

export function toMediaReference(media: {
  _id: string;
  mimeType: string;
  status: string;
  storedUrl?: string;
}): MediaReference {
  return {
    id: media._id,
    mimeType: media.mimeType,
    processingStatus: (media.status as ProcessingStatus) ?? "pending",
    securePreviewCapable: media.status === "ready",
    url: media.storedUrl,
  };
}