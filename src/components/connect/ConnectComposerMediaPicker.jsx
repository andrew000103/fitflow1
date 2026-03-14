import { useEffect, useMemo, useState } from 'react'
import { CONNECT_MEDIA_CONFIG, getComposerAcceptValue } from '../../config/mediaConfig.js'
import { tx } from '../../utils/appLanguage.js'

function createPreviewRecord(file) {
  return {
    id: `${file.name}-${file.lastModified}`,
    file,
    url: URL.createObjectURL(file),
    kind: file.type.startsWith('video/') ? 'video' : 'image',
  }
}

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function ConnectComposerMediaPicker({
  appLanguage,
  viewerId,
  selectedFiles,
  onFilesChange,
  uploadError,
  uploadProgress,
  isUploading,
}) {
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    const nextPreviews = selectedFiles.map((file) => createPreviewRecord(file))
    setPreviews(nextPreviews)

    return () => {
      nextPreviews.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [selectedFiles])

  const acceptValue = useMemo(() => getComposerAcceptValue(viewerId), [viewerId])
  const helperText = tx(
    appLanguage,
    `이미지 최대 ${CONNECT_MEDIA_CONFIG.MAX_IMAGES_PER_POST}장, 이미지 ${CONNECT_MEDIA_CONFIG.MAX_IMAGE_SIZE_MB}MB 이하, 영상 ${CONNECT_MEDIA_CONFIG.MAX_VIDEO_DURATION_SEC}초 / ${CONNECT_MEDIA_CONFIG.MAX_VIDEO_SIZE_MB}MB 이하`,
    `Up to ${CONNECT_MEDIA_CONFIG.MAX_IMAGES_PER_POST} images, ${CONNECT_MEDIA_CONFIG.MAX_IMAGE_SIZE_MB}MB each, video up to ${CONNECT_MEDIA_CONFIG.MAX_VIDEO_DURATION_SEC}s / ${CONNECT_MEDIA_CONFIG.MAX_VIDEO_SIZE_MB}MB`,
  )

  return (
    <div className="connect-media-picker">
      <div className="connect-media-picker-head">
        <div>
          <strong>{tx(appLanguage, '이미지 우선, 짧은 영상은 제한적으로', 'Images first, short video only')}</strong>
        </div>
        <label className="inline-action">
          {tx(appLanguage, '미디어 선택', 'Choose media')}
          <input
            hidden
            type="file"
            accept={acceptValue}
            multiple
            onChange={(event) => onFilesChange(Array.from(event.target.files || []))}
          />
        </label>
      </div>

      <p className="connect-media-helper">{helperText}</p>

      {uploadError ? <div className="connect-upload-error">{uploadError}</div> : null}

      {isUploading ? (
        <div className="connect-upload-progress">
          <span>{tx(appLanguage, '업로드 준비 중', 'Preparing upload')}</span>
          <strong>{uploadProgress}%</strong>
        </div>
      ) : null}

      {previews.length > 0 ? (
        <div className="connect-composer-preview-grid">
          {previews.map((preview, index) => (
            <div className="connect-composer-preview-card" key={preview.id}>
              {preview.kind === 'image' ? (
                <img src={preview.url} alt="" loading="lazy" />
              ) : (
                <video src={preview.url} muted playsInline preload="metadata" />
              )}
              <div className="connect-composer-preview-meta">
                <span>{preview.kind === 'image' ? tx(appLanguage, '이미지', 'Image') : tx(appLanguage, '영상', 'Video')}</span>
                <span>{formatMb(preview.file.size)}</span>
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => onFilesChange(selectedFiles.filter((_, fileIndex) => fileIndex !== index))}
                >
                  {tx(appLanguage, '제거', 'Remove')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default ConnectComposerMediaPicker
