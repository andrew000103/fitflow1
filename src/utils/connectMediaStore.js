const DATABASE_NAME = 'fitflow-connect-media'
const DATABASE_VERSION = 1
const STORE_NAME = 'media-assets'

let databasePromise = null

function getDatabase() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null)
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'key' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  return databasePromise
}

export async function saveMediaAsset({ key, blob, mimeType, kind, metadata = {} }) {
  const database = await getDatabase()
  if (!database) {
    return
  }

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    store.put({
      key,
      blob,
      mimeType,
      kind,
      metadata,
      createdAt: new Date().toISOString(),
    })

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function getMediaAssetRecord(key) {
  const database = await getDatabase()
  if (!database) {
    return null
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(key)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function getMediaAssetUrl(key) {
  const asset = await getMediaAssetRecord(key)
  if (!asset?.blob) {
    return null
  }

  return URL.createObjectURL(asset.blob)
}

export async function removeMediaAsset(key) {
  const database = await getDatabase()
  if (!database) {
    return
  }

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    store.delete(key)

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}
