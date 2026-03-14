import { useEffect, useMemo, useState } from 'react'
import { getMediaAssetUrl } from '../../utils/connectMediaStore.js'
import { tx } from '../../utils/appLanguage.js'
import AppIcon from '../AppIcon.jsx'

function useResolvedMediaUrls(media = [], mode = 'feed') {
  const [urls, setUrls] = useState({})

  const targetMedia = useMemo(() => {
    if (mode === 'feed') {
      return media.slice(0, 2)
    }
    return media
  }, [media, mode])

  useEffect(() => {
    let active = true
    const cleanupUrls = []

    async function loadUrls() {
      const nextUrls = {}

      for (const item of targetMedia) {
        if (item.remoteUrl) {
          nextUrls[item.storageKey || item.id] = item.remoteUrl
        }

        if (item.posterUrl) {
          nextUrls[item.posterStorageKey || `${item.id}-poster`] = item.posterUrl
        }

        if (item.storageKey) {
          const sourceUrl = await getMediaAssetUrl(item.storageKey)
          if (sourceUrl) {
            nextUrls[item.storageKey] = sourceUrl
            cleanupUrls.push(sourceUrl)
          }
        }

        if (item.posterStorageKey) {
          const posterUrl = await getMediaAssetUrl(item.posterStorageKey)
          if (posterUrl) {
            nextUrls[item.posterStorageKey] = posterUrl
            cleanupUrls.push(posterUrl)
          }
        }
      }

      if (active) {
        setUrls(nextUrls)
      } else {
        cleanupUrls.forEach((url) => URL.revokeObjectURL(url))
      }
    }

    loadUrls()

    return () => {
      active = false
      cleanupUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [targetMedia])

  return urls
}

function ConnectPostMedia({ appLanguage, media = [], mode = 'feed' }) {
  const urls = useResolvedMediaUrls(media, mode)

  if (!media.length) {
    return null
  }

  const imageItems = media.filter((item) => item.mediaType === 'image')
  const videoItem = media.find((item) => item.mediaType === 'video')

  if (videoItem) {
    const posterUrl = urls[videoItem.posterStorageKey || `${videoItem.id}-poster`] || null
    const videoUrl = urls[videoItem.storageKey || videoItem.id] || null

    if (mode === 'detail' && videoUrl) {
      return (
        <div className="connect-post-media detail">
          <video
            className="connect-post-video"
            controls
            playsInline
            preload="metadata"
            muted
            poster={posterUrl || undefined}
          >
            <source src={videoUrl} type={videoItem.mimeType} />
          </video>
          <span className="connect-post-media-note">
            {tx(appLanguage, '자동재생 없이 사용자 동작 시에만 재생됩니다.', 'Only plays when the user interacts, with no autoplay.')}
          </span>
        </div>
      )
    }

    return (
      <div className="connect-post-media feed has-video">
        {posterUrl ? <img src={posterUrl} alt="" loading="lazy" /> : <div className="connect-post-media-placeholder" />}
        <span className="connect-video-play-badge"><AppIcon name="play" size="sm" /></span>
        <span className="connect-video-duration">{videoItem.durationSec || 0}s</span>
      </div>
    )
  }

  if (mode === 'detail') {
    return (
      <div className={`connect-post-media detail image-count-${Math.min(imageItems.length, 4)}`}>
        {imageItems.map((item) => {
          const imageUrl = urls[item.storageKey || item.id] || null
          return imageUrl ? <img key={item.id} src={imageUrl} alt="" loading="lazy" /> : null
        })}
      </div>
    )
  }

  const previewImages = imageItems.slice(0, 2)

  return (
    <div className={`connect-post-media feed image-count-${previewImages.length}`}>
      {previewImages.map((item) => {
        const imageUrl = urls[item.storageKey || item.id] || null
        return imageUrl ? <img key={item.id} src={imageUrl} alt="" loading="lazy" /> : null
      })}
      {imageItems.length > 2 ? (
        <span className="connect-image-count-badge">+{imageItems.length - 1}</span>
      ) : null}
    </div>
  )
}

export default ConnectPostMedia
