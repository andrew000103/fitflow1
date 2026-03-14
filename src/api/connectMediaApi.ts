// Edge/API contract sketch for a future Cloudflare Worker implementation.
// The app currently uses a local IndexedDB-backed upload path, but these
// request/response shapes are designed so the frontend does not need a
// large rewrite when direct-to-R2 uploads are added.

export interface CreateMediaUploadUrlRequest {
  postId: string
  mediaType: 'image' | 'video'
  mimeType: string
  sizeBytes: number
  extension: string
}

export interface CreateMediaUploadUrlResponse {
  mediaId: string
  storageKey: string
  uploadUrl: string
  publicUrl?: string
  expiresAt: string
}

export interface FinalizeMediaUploadRequest {
  postId: string
  mediaId: string
  storageKey: string
  posterStorageKey?: string | null
  mediaType: 'image' | 'video'
  mimeType: string
  sizeBytes: number
  width?: number | null
  height?: number | null
  durationSec?: number | null
  sortOrder: number
}

export const connectMediaApiNotes = [
  'Create signed upload URLs on the edge, then upload directly from the client to R2.',
  'Persist only post + media metadata in D1/Firestore after the object upload succeeds.',
  'Use Cloudflare Images or a small worker thumbnail step for feed thumbnails later.',
  'Upgrade video posts to Cloudflare Stream or Mux only when poster/video delivery becomes a bottleneck.',
]
