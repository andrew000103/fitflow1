// Firestore-oriented target schema for a low-cost MVP media community.
// The current app stores post documents client-side, but these collection
// shapes are intentionally aligned with a future Cloudflare Worker + D1/R2
// or Firebase/Firestore migration path.

export const connectCollections = {
  users: {
    id: 'user_id',
    fields: [
      'display_name',
      'avatar_url',
      'goal',
      'role',
      'created_at',
    ],
  },
  posts: {
    id: 'post_id',
    fields: [
      'author_id',
      'post_type',
      'category',
      'caption',
      'status',
      'like_count',
      'comment_count',
      'media_count',
      'created_at',
      'updated_at',
    ],
  },
  post_media: {
    id: 'media_id',
    fields: [
      'post_id',
      'media_type',
      'storage_key',
      'poster_storage_key',
      'mime_type',
      'size_bytes',
      'width',
      'height',
      'duration_sec',
      'sort_order',
      'status',
      'created_at',
    ],
  },
  likes: {
    id: 'like_id',
    fields: ['post_id', 'user_id', 'created_at'],
  },
  comments: {
    id: 'comment_id',
    fields: ['post_id', 'author_id', 'body', 'parent_comment_id', 'created_at'],
  },
}

export const connectIndexes = [
  'posts: status + created_at desc',
  'posts: category + created_at desc',
  'posts: goal + created_at desc',
  'post_media: post_id + sort_order asc',
  'likes: post_id + user_id unique',
  'comments: post_id + created_at desc',
]

export const connectSchemaNotes = [
  'Store media metadata separately from object storage keys so media delivery can move from IndexedDB to R2 or Cloudflare Stream later without changing post documents.',
  'Keep counts denormalized on posts for low-cost feed reads.',
  'Use one video max per post to avoid heavy transcoding and moderation cost in the MVP.',
  'Prefer cursor pagination on posts created_at instead of offset pagination once real backend is added.',
]
