import { saveMediaAsset } from './connectMediaStore.js'
import { createMediaDraftRecord, validatePostFiles } from './connectMedia.js'

// This local implementation mirrors the shape of an edge upload workflow:
// 1. validate metadata and policy
// 2. create storage keys and media records
// 3. persist binaries out-of-band from post metadata
// Today we store binaries in IndexedDB so the UI works without a backend.
// TODO: Replace saveMediaAsset with signed direct uploads to R2/Cloudflare later.

export async function createLocalMediaUploadDraft({ files, postId, viewerId = 'me', onProgress }) {
  const { files: validFiles, containsVideo } = await validatePostFiles(files, viewerId)

  const mediaDrafts = []
  let completedSteps = 0
  const totalSteps = Math.max(validFiles.length * 2, 1)

  const updateProgress = () => {
    completedSteps += 1
    onProgress?.(Math.min(95, Math.round((completedSteps / totalSteps) * 100)))
  }

  for (let index = 0; index < validFiles.length; index += 1) {
    const draft = await createMediaDraftRecord({
      postId,
      file: validFiles[index],
      sortOrder: index,
      onProgress: updateProgress,
    })

    await saveMediaAsset({
      key: draft.storageKey,
      blob: draft.file,
      mimeType: draft.mimeType,
      kind: draft.mediaType,
      metadata: {
        width: draft.width,
        height: draft.height,
        durationSec: draft.durationSec,
      },
    })

    if (draft.posterStorageKey && draft.posterBlob) {
      await saveMediaAsset({
        key: draft.posterStorageKey,
        blob: draft.posterBlob,
        mimeType: 'image/jpeg',
        kind: 'image',
        metadata: {
          width: draft.width,
          height: draft.height,
        },
      })
    }

    updateProgress()
    mediaDrafts.push({
      id: draft.id,
      postId: draft.postId,
      mediaType: draft.mediaType,
      storageKey: draft.storageKey,
      posterStorageKey: draft.posterStorageKey,
      mimeType: draft.mimeType,
      sizeBytes: draft.sizeBytes,
      width: draft.width,
      height: draft.height,
      durationSec: draft.durationSec,
      sortOrder: draft.sortOrder,
      status: draft.status,
      createdAt: draft.createdAt,
    })
  }

  onProgress?.(100)

  return {
    media: mediaDrafts,
    containsVideo,
    imageCount: mediaDrafts.filter((item) => item.mediaType === 'image').length,
  }
}
