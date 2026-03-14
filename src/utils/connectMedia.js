import {
  CONNECT_MEDIA_CONFIG,
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  canViewerUploadVideo,
} from '../config/mediaConfig.js'

function bytesFromMb(megabytes) {
  return megabytes * 1024 * 1024
}

function readFileDimensions(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ width: null, height: null })
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
      URL.revokeObjectURL(objectUrl)
    }

    image.onerror = () => {
      resolve({ width: null, height: null })
      URL.revokeObjectURL(objectUrl)
    }

    image.src = objectUrl
  })
}

function readVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    video.onloadedmetadata = () => {
      resolve({
        durationSec: Math.round(video.duration || 0),
        width: video.videoWidth || null,
        height: video.videoHeight || null,
        objectUrl,
        video,
      })
    }

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('video-metadata-failed'))
    }

    video.src = objectUrl
  })
}

async function extractVideoPosterBlob(file) {
  try {
    const { objectUrl, video } = await readVideoMetadata(file)
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 1280
    const context = canvas.getContext('2d')

    await new Promise((resolve) => {
      const handleSeeked = () => {
        resolve()
      }

      video.currentTime = Math.min(0.4, Math.max(0, video.duration / 5 || 0.4))
      video.onseeked = handleSeeked
    })

    context?.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    URL.revokeObjectURL(objectUrl)

    return blob || null
  } catch {
    return null
  }
}

export function buildStorageKey({ postId, mediaId, kind, extension }) {
  return `connect/${postId}/${mediaId}.${extension || (kind === 'video' ? 'mp4' : 'jpg')}`
}

export function getFileExtension(file) {
  const rawName = file.name || ''
  const extension = rawName.includes('.') ? rawName.split('.').pop() : ''
  return extension?.toLowerCase() || ''
}

export function getPostMediaKind(file) {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

export async function validatePostFiles(files, viewerId = 'me') {
  const selectedFiles = Array.from(files || [])

  if (!selectedFiles.length) {
    return { files: [], containsVideo: false }
  }

  const imageFiles = selectedFiles.filter((file) => getPostMediaKind(file) === 'image')
  const videoFiles = selectedFiles.filter((file) => getPostMediaKind(file) === 'video')

  if (imageFiles.length && videoFiles.length) {
    throw new Error('A post can have images or one video, but not both.')
  }

  if (imageFiles.length > CONNECT_MEDIA_CONFIG.MAX_IMAGES_PER_POST) {
    throw new Error(`You can upload up to ${CONNECT_MEDIA_CONFIG.MAX_IMAGES_PER_POST} images per post.`)
  }

  if (videoFiles.length > 1) {
    throw new Error('Only one video is allowed per post.')
  }

  if (videoFiles.length && !canViewerUploadVideo(viewerId)) {
    throw new Error('Video uploads are disabled for this account.')
  }

  for (const file of imageFiles) {
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      throw new Error('Only JPG, PNG, and WEBP images are supported in this MVP.')
    }

    if (file.size > bytesFromMb(CONNECT_MEDIA_CONFIG.MAX_IMAGE_SIZE_MB)) {
      throw new Error(`Each image must be ${CONNECT_MEDIA_CONFIG.MAX_IMAGE_SIZE_MB}MB or smaller.`)
    }
  }

  for (const file of videoFiles) {
    if (!VIDEO_MIME_TYPES.includes(file.type)) {
      throw new Error('Only MP4, WEBM, and MOV videos are supported in this MVP.')
    }

    if (file.size > bytesFromMb(CONNECT_MEDIA_CONFIG.MAX_VIDEO_SIZE_MB)) {
      throw new Error(`Video files must be ${CONNECT_MEDIA_CONFIG.MAX_VIDEO_SIZE_MB}MB or smaller.`)
    }

    const metadata = await readVideoMetadata(file)
    URL.revokeObjectURL(metadata.objectUrl)
    if (metadata.durationSec > CONNECT_MEDIA_CONFIG.MAX_VIDEO_DURATION_SEC) {
      throw new Error(`Videos must be ${CONNECT_MEDIA_CONFIG.MAX_VIDEO_DURATION_SEC} seconds or shorter.`)
    }
  }

  return {
    files: selectedFiles,
    containsVideo: videoFiles.length > 0,
  }
}

export async function createMediaDraftRecord({ postId, file, sortOrder, onProgress }) {
  const kind = getPostMediaKind(file)
  const mediaId = `media-${Date.now()}-${sortOrder + 1}`
  const extension = getFileExtension(file)
  const storageKey = buildStorageKey({ postId, mediaId, kind, extension })

  if (kind === 'video') {
    const metadata = await readVideoMetadata(file)
    const posterBlob = await extractVideoPosterBlob(file)
    const posterKey = posterBlob
      ? buildStorageKey({ postId, mediaId: `${mediaId}-poster`, kind: 'image', extension: 'jpg' })
      : null
    URL.revokeObjectURL(metadata.objectUrl)

    onProgress?.()

    return {
      id: mediaId,
      postId,
      mediaType: 'video',
      storageKey,
      posterStorageKey: posterKey,
      mimeType: file.type,
      sizeBytes: file.size,
      width: metadata.width,
      height: metadata.height,
      durationSec: metadata.durationSec,
      sortOrder,
      status: 'ready',
      createdAt: new Date().toISOString(),
      file,
      posterBlob,
    }
  }

  const dimensions = await readFileDimensions(file)
  onProgress?.()

  return {
    id: mediaId,
    postId,
    mediaType: 'image',
    storageKey,
    posterStorageKey: null,
    mimeType: file.type,
    sizeBytes: file.size,
    width: dimensions.width,
    height: dimensions.height,
    durationSec: null,
    sortOrder,
    status: 'ready',
    createdAt: new Date().toISOString(),
    file,
    posterBlob: null,
  }
}
