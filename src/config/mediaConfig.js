function parseBoolean(value, fallback) {
  if (value === undefined) {
    return fallback
  }

  return value === 'true'
}

function parseNumber(value, fallback) {
  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? nextValue : fallback
}

function parseList(value, fallback = []) {
  if (!value) {
    return fallback
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const CONNECT_MEDIA_CONFIG = {
  ENABLE_VIDEO_UPLOADS: parseBoolean(import.meta.env.VITE_ENABLE_VIDEO_UPLOADS, true),
  VIDEO_UPLOAD_ADMIN_ONLY: parseBoolean(import.meta.env.VITE_VIDEO_UPLOAD_ADMIN_ONLY, false),
  VIDEO_UPLOAD_ALLOWED_USER_IDS: parseList(import.meta.env.VITE_VIDEO_UPLOAD_ALLOWED_USER_IDS, ['me']),
  MAX_IMAGE_SIZE_MB: parseNumber(import.meta.env.VITE_MAX_IMAGE_SIZE_MB, 4),
  MAX_VIDEO_SIZE_MB: parseNumber(import.meta.env.VITE_MAX_VIDEO_SIZE_MB, 10),
  MAX_VIDEO_DURATION_SEC: parseNumber(import.meta.env.VITE_MAX_VIDEO_DURATION_SEC, 15),
  MAX_IMAGES_PER_POST: parseNumber(import.meta.env.VITE_MAX_IMAGES_PER_POST, 4),
  CONNECT_FEED_PAGE_SIZE: parseNumber(import.meta.env.VITE_CONNECT_FEED_PAGE_SIZE, 18),
}

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

export function canViewerUploadVideo(viewerId = 'me') {
  if (!CONNECT_MEDIA_CONFIG.ENABLE_VIDEO_UPLOADS) {
    return false
  }

  if (!CONNECT_MEDIA_CONFIG.VIDEO_UPLOAD_ADMIN_ONLY) {
    return true
  }

  return CONNECT_MEDIA_CONFIG.VIDEO_UPLOAD_ALLOWED_USER_IDS.includes(viewerId)
}

export function getComposerAcceptValue(viewerId = 'me') {
  const acceptedTypes = [...IMAGE_MIME_TYPES]

  if (canViewerUploadVideo(viewerId)) {
    acceptedTypes.push(...VIDEO_MIME_TYPES)
  }

  return acceptedTypes.join(',')
}
