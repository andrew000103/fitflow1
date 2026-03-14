import { supabase } from '../../lib/supabase.js'
import { createNotification } from '../notifications/notificationApi.ts'

type FeedMode = 'recommended' | 'crew' | 'profile'

type ProfileMap = Record<string, { displayName?: string | null; username?: string | null; avatarUrl?: string | null }>

export interface UnifiedComment {
  id: string
  postId: string
  authorUserId: string
  authorName: string
  body: string
  createdAt: string
}

export interface UnifiedFeedItem {
  id: string
  sourceId: string
  type: 'post' | 'activity'
  createdAt: string
  updatedAt?: string
  actorUserId: string
  actorName: string
  title: string
  body: string
  eventType?: string
  eventPayload?: Record<string, unknown>
  postType?: string
  reactionCount: number
  reactionCounts: Record<string, number>
  commentCount: number
  viewerReacted: boolean
  viewerReactionType?: string
  comments: UnifiedComment[]
  engagementScore: number
  challenge: boolean
}

const FEED_TABLES = {
  posts: 'posts',
  events: 'activity_feed_events',
  relationships: 'social_relationships',
  reactions: 'post_reactions',
  comments: 'comments',
  profiles: 'profiles',
} as const

const RELATIONSHIP_COLUMNS = {
  requesterId: 'requester_id',
  addresseeId: 'addressee_id',
  type: 'relation_type',
  status: 'status',
} as const

const POST_COLUMNS = {
  id: 'id',
  authorUserId: 'author_id',
  title: 'title',
  body: 'body',
  postType: 'post_type',
  metadata: 'metadata',
  createdAt: 'created_at',
} as const

const EVENT_COLUMNS = {
  id: 'id',
  actorUserId: 'user_id',
  eventType: 'event_type',
  payload: 'payload',
  createdAt: 'created_at',
} as const

const REACTION_COLUMNS = {
  postId: 'post_id',
  userId: 'user_id',
  reactionType: 'reaction_type',
} as const

const COMMENT_COLUMNS = {
  id: 'id',
  postId: 'post_id',
  authorUserId: 'author_id',
  body: 'body',
  createdAt: 'created_at',
} as const

function toArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : []
}

function toIsoString(value: unknown) {
  return typeof value === 'string' ? value : new Date().toISOString()
}

function toOptionalIsoString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function buildCrewRelationshipFilter(currentUserId: string) {
  return `and(${RELATIONSHIP_COLUMNS.requesterId}.eq.${currentUserId},${RELATIONSHIP_COLUMNS.type}.eq.crew,${RELATIONSHIP_COLUMNS.status}.eq.accepted),and(${RELATIONSHIP_COLUMNS.addresseeId}.eq.${currentUserId},${RELATIONSHIP_COLUMNS.type}.eq.crew,${RELATIONSHIP_COLUMNS.status}.eq.accepted)`
}

async function loadCrewMemberIds(currentUserId: string) {
  const { data, error } = await supabase
    .from(FEED_TABLES.relationships)
    .select(`${RELATIONSHIP_COLUMNS.requesterId}, ${RELATIONSHIP_COLUMNS.addresseeId}`)
    .or(buildCrewRelationshipFilter(currentUserId))

  if (error) {
    throw error
  }

  const rows = toArray<Record<string, string>>(data)

  return rows.reduce<string[]>((allIds, row) => {
    const firstId = row[RELATIONSHIP_COLUMNS.requesterId]
    const secondId = row[RELATIONSHIP_COLUMNS.addresseeId]
    const crewUserId = firstId === currentUserId ? secondId : firstId

    if (crewUserId && !allIds.includes(crewUserId)) {
      allIds.push(crewUserId)
    }

    return allIds
  }, [])
}

async function loadProfiles(userIds: string[]) {
  if (!userIds.length) {
    return {}
  }

  const { data, error } = await supabase
    .from(FEED_TABLES.profiles)
    .select('user_id, display_name, username, avatar_url')
    .in('user_id', userIds)

  if (error) {
    throw error
  }

  return toArray<Record<string, string | null>>(data).reduce<ProfileMap>((map, item) => {
    const userId = String(item.user_id || '')

    if (userId) {
      map[userId] = {
        displayName: item.display_name,
        username: item.username,
        avatarUrl: item.avatar_url,
      }
    }

    return map
  }, {})
}

function getProfileDisplayName(profile?: { displayName?: string | null; username?: string | null }) {
  if (profile?.displayName) {
    return String(profile.displayName)
  }

  if (profile?.username) {
    return String(profile.username)
  }

  return 'FitFlow 사용자'
}

async function loadReactionSummary(postIds: string[], currentUserId: string) {
  if (!postIds.length) {
    return {
      counts: {} as Record<string, number>,
      countsByType: {} as Record<string, Record<string, number>>,
      viewerReactionMap: {} as Record<string, boolean>,
      viewerReactionTypeMap: {} as Record<string, string>,
    }
  }

  const { data, error } = await supabase
    .from(FEED_TABLES.reactions)
    .select(`${REACTION_COLUMNS.postId}, ${REACTION_COLUMNS.userId}, ${REACTION_COLUMNS.reactionType}`)
    .in(REACTION_COLUMNS.postId, postIds)

  if (error) {
    throw error
  }

  return toArray<Record<string, string>>(data).reduce(
    (acc, item) => {
      const postId = String(item[REACTION_COLUMNS.postId] || '')
      const reactionType = String(item[REACTION_COLUMNS.reactionType] || '')

      if (!postId) {
        return acc
      }

      acc.counts[postId] = (acc.counts[postId] || 0) + 1
      acc.countsByType[postId] = acc.countsByType[postId] || {}
      if (reactionType) {
        acc.countsByType[postId][reactionType] = (acc.countsByType[postId][reactionType] || 0) + 1
      }

      if (String(item[REACTION_COLUMNS.userId] || '') === currentUserId) {
        acc.viewerReactionMap[postId] = true
        acc.viewerReactionTypeMap[postId] = reactionType
      }

      return acc
    },
    {
      counts: {} as Record<string, number>,
      countsByType: {} as Record<string, Record<string, number>>,
      viewerReactionMap: {} as Record<string, boolean>,
      viewerReactionTypeMap: {} as Record<string, string>,
    },
  )
}

async function loadCommentsPreview(postIds: string[]) {
  if (!postIds.length) {
    return {
      previewMap: {} as Record<string, UnifiedComment[]>,
      countMap: {} as Record<string, number>,
    }
  }

  const { data, error } = await supabase
    .from(FEED_TABLES.comments)
    .select(`${COMMENT_COLUMNS.id}, ${COMMENT_COLUMNS.postId}, ${COMMENT_COLUMNS.authorUserId}, ${COMMENT_COLUMNS.body}, ${COMMENT_COLUMNS.createdAt}`)
    .in(COMMENT_COLUMNS.postId, postIds)
    .order(COMMENT_COLUMNS.createdAt, { ascending: false })

  if (error) {
    throw error
  }

  const rows = toArray<Record<string, string>>(data)
  const commentAuthorIds = [...new Set(rows.map((item) => String(item[COMMENT_COLUMNS.authorUserId] || '')).filter(Boolean))]
  const commentProfiles = await loadProfiles(commentAuthorIds)

  return rows.reduce(
    (acc, item) => {
      const postId = String(item[COMMENT_COLUMNS.postId] || '')

      if (!postId) {
        return acc
      }

      const nextComment: UnifiedComment = {
        id: String(item[COMMENT_COLUMNS.id] || ''),
        postId,
        authorUserId: String(item[COMMENT_COLUMNS.authorUserId] || ''),
        authorName: getProfileDisplayName(commentProfiles[String(item[COMMENT_COLUMNS.authorUserId] || '')]),
        body: String(item[COMMENT_COLUMNS.body] || ''),
        createdAt: toIsoString(item[COMMENT_COLUMNS.createdAt]),
      }

      acc.countMap[postId] = (acc.countMap[postId] || 0) + 1
      acc.previewMap[postId] = [...(acc.previewMap[postId] || []), nextComment].slice(0, 3)
      return acc
    },
    {
      previewMap: {} as Record<string, UnifiedComment[]>,
      countMap: {} as Record<string, number>,
    },
  )
}

async function loadPostsForUserIds(userIds: string[], limit: number) {
  let query = supabase
    .from(FEED_TABLES.posts)
    .select(`${POST_COLUMNS.id}, ${POST_COLUMNS.authorUserId}, ${POST_COLUMNS.title}, ${POST_COLUMNS.body}, ${POST_COLUMNS.postType}, ${POST_COLUMNS.metadata}, ${POST_COLUMNS.createdAt}, updated_at`)
    .order(POST_COLUMNS.createdAt, { ascending: false })
    .limit(limit)

  if (userIds.length) {
    query = query.in(POST_COLUMNS.authorUserId, userIds)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return toArray<Record<string, unknown>>(data)
}

async function loadEventsForUserIds(userIds: string[], limit: number) {
  let query = supabase
    .from(FEED_TABLES.events)
    .select(`${EVENT_COLUMNS.id}, ${EVENT_COLUMNS.actorUserId}, ${EVENT_COLUMNS.eventType}, ${EVENT_COLUMNS.payload}, ${EVENT_COLUMNS.createdAt}`)
    .order(EVENT_COLUMNS.createdAt, { ascending: false })
    .limit(limit)

  if (userIds.length) {
    query = query.in(EVENT_COLUMNS.actorUserId, userIds)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return toArray<Record<string, unknown>>(data)
}

function buildActivityTitle(eventType: string, payload: Record<string, unknown>, actorName: string) {
  if (eventType.includes('pr')) {
    return `${actorName} 님이 새 PR을 달성했어요`
  }
  if (eventType.includes('streak')) {
    return `${actorName} 님의 연속 기록이 이어지고 있어요`
  }
  if (eventType.includes('challenge')) {
    return `${actorName} 님이 챌린지에 참여했어요`
  }
  return `${actorName} 님의 새로운 활동`
}

function buildActivityBody(eventType: string, payload: Record<string, unknown>) {
  if (eventType.includes('pr')) {
    return String(payload.exercise_name || payload.exerciseName || '최고 기록을 경신했습니다.')
  }
  if (eventType.includes('streak')) {
    return `${payload.streak_days || payload.streakDays || '-'}일 연속 기록 중`
  }
  if (eventType.includes('challenge')) {
    return String(payload.challenge_title || payload.challengeTitle || '오늘 챌린지 진행 중')
  }
  return String(payload.summary || payload.body || '새 활동이 기록되었습니다.')
}

function buildUnifiedItems({
  posts,
  events,
  profiles,
  reactions,
  comments,
}: {
  posts: Record<string, unknown>[]
  events: Record<string, unknown>[]
  profiles: ProfileMap
  reactions: {
    counts: Record<string, number>
    countsByType: Record<string, Record<string, number>>
    viewerReactionMap: Record<string, boolean>
    viewerReactionTypeMap: Record<string, string>
  }
  comments: { previewMap: Record<string, UnifiedComment[]>; countMap: Record<string, number> }
}): UnifiedFeedItem[] {
  const postItems: UnifiedFeedItem[] = posts.map((post) => {
    const postId = String(post[POST_COLUMNS.id] || '')
    const actorUserId = String(post[POST_COLUMNS.authorUserId] || '')
    const metadata = (post[POST_COLUMNS.metadata] as Record<string, unknown>) || {}
    const postComments = comments.previewMap[postId] || []
    const reactionCount = reactions.counts[postId] || 0
    const commentCount = comments.countMap[postId] || 0

    return {
      id: `post-${postId}`,
      sourceId: postId,
      type: 'post',
      createdAt: toIsoString(post[POST_COLUMNS.createdAt]),
      updatedAt: toOptionalIsoString(post.updated_at),
      actorUserId,
      actorName: getProfileDisplayName(profiles[actorUserId]),
      title: String(post[POST_COLUMNS.title] || '새 게시물'),
      body: String(post[POST_COLUMNS.body] || metadata.summary || ''),
      postType: String(post[POST_COLUMNS.postType] || ''),
      reactionCount,
      reactionCounts: reactions.countsByType[postId] || {},
      commentCount,
      viewerReacted: Boolean(reactions.viewerReactionMap[postId]),
      viewerReactionType: reactions.viewerReactionTypeMap[postId] || '',
      comments: postComments,
      engagementScore: reactionCount * 2 + commentCount,
      challenge: Boolean(metadata.challenge_title || metadata.challengeTitle || metadata.challenge_id || metadata.challengeId),
    }
  })

  const activityItems: UnifiedFeedItem[] = events.map((event) => {
    const actorUserId = String(event[EVENT_COLUMNS.actorUserId] || '')
    const actorName = getProfileDisplayName(profiles[actorUserId])
    const eventType = String(event[EVENT_COLUMNS.eventType] || 'activity')
    const payload = (event[EVENT_COLUMNS.payload] as Record<string, unknown>) || {}
    const title = buildActivityTitle(eventType, payload, actorName)
    const body = buildActivityBody(eventType, payload)

    return {
      id: `activity-${String(event[EVENT_COLUMNS.id] || '')}`,
      sourceId: String(event[EVENT_COLUMNS.id] || ''),
      type: 'activity',
      createdAt: toIsoString(event[EVENT_COLUMNS.createdAt]),
      actorUserId,
      actorName,
      title,
      body,
      eventType,
      eventPayload: payload,
      reactionCount: 0,
      reactionCounts: {},
      commentCount: 0,
      viewerReacted: false,
      viewerReactionType: '',
      comments: [],
      engagementScore:
        eventType.includes('pr')
          ? 12
          : eventType.includes('streak')
          ? 10
          : eventType.includes('challenge')
          ? 8
          : 4,
      challenge: eventType.includes('challenge'),
    }
  })

  return [...postItems, ...activityItems].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}

async function buildFeed(mode: FeedMode, currentUserId: string, targetUserId?: string, limit = 24) {
  let scopedUserIds: string[] = []

  if (mode === 'crew') {
    scopedUserIds = await loadCrewMemberIds(currentUserId)
  }

  if (mode === 'profile' && targetUserId) {
    scopedUserIds = [targetUserId]
  }

  const [posts, events] = await Promise.all([
    loadPostsForUserIds(scopedUserIds, limit),
    loadEventsForUserIds(scopedUserIds, limit),
  ])

  const actorIds = [...new Set([
    ...posts.map((post) => String(post[POST_COLUMNS.authorUserId] || '')).filter(Boolean),
    ...events.map((event) => String(event[EVENT_COLUMNS.actorUserId] || '')).filter(Boolean),
  ])]

  const profiles = await loadProfiles(actorIds)
  const postIds = posts.map((post) => String(post[POST_COLUMNS.id] || '')).filter(Boolean)
  const reactions = await loadReactionSummary(postIds, currentUserId)
  const comments = await loadCommentsPreview(postIds)

  return buildUnifiedItems({
    posts,
    events,
    profiles,
    reactions,
    comments,
  })
}

export async function getRecommendedFeed(currentUserId: string, limit = 24) {
  return buildFeed('recommended', currentUserId, undefined, limit)
}

export async function getCrewFeed(currentUserId: string, limit = 24) {
  return buildFeed('crew', currentUserId, undefined, limit)
}

export async function getProfileFeed(currentUserId: string, profileUserId: string, limit = 24) {
  return buildFeed('profile', currentUserId, profileUserId, limit)
}

export async function updateSocialPost(postId: string, currentUserId: string, payload: { title: string; body: string }) {
  const { data, error } = await supabase
    .from(FEED_TABLES.posts)
    .update({
      title: payload.title,
      body: payload.body,
      updated_at: new Date().toISOString(),
    })
    .eq(POST_COLUMNS.id, postId)
    .eq(POST_COLUMNS.authorUserId, currentUserId)
    .select(`${POST_COLUMNS.id}, ${POST_COLUMNS.title}, ${POST_COLUMNS.body}, updated_at`)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function deleteSocialPost(postId: string, currentUserId: string) {
  const { error } = await supabase
    .from(FEED_TABLES.posts)
    .delete()
    .eq(POST_COLUMNS.id, postId)
    .eq(POST_COLUMNS.authorUserId, currentUserId)

  if (error) {
    throw error
  }
}

async function loadPostAuthor(postId: string) {
  const { data, error } = await supabase
    .from(FEED_TABLES.posts)
    .select(`${POST_COLUMNS.id}, ${POST_COLUMNS.authorUserId}, ${POST_COLUMNS.title}`)
    .eq(POST_COLUMNS.id, postId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function createSocialReaction(postId: string, currentUserId: string, reactionType: 'cheer' | 'fire' | 'respect') {
  const { data: existingReaction, error: existingReactionError } = await supabase
    .from(FEED_TABLES.reactions)
    .select(`id, ${REACTION_COLUMNS.reactionType}`)
    .eq(REACTION_COLUMNS.postId, postId)
    .eq(REACTION_COLUMNS.userId, currentUserId)
    .maybeSingle()

  if (existingReactionError) {
    throw existingReactionError
  }

  if (existingReaction) {
    const currentReactionType = String(existingReaction[REACTION_COLUMNS.reactionType] || '')

    if (currentReactionType === reactionType) {
      const { error: deleteError } = await supabase
        .from(FEED_TABLES.reactions)
        .delete()
        .eq('id', existingReaction.id)
        .eq(REACTION_COLUMNS.userId, currentUserId)

      if (deleteError) {
        throw deleteError
      }

      return { mode: 'removed' }
    }

    const { error: updateError } = await supabase
      .from(FEED_TABLES.reactions)
      .update({
        [REACTION_COLUMNS.reactionType]: reactionType,
      })
      .eq('id', existingReaction.id)
      .eq(REACTION_COLUMNS.userId, currentUserId)

    if (updateError) {
      throw updateError
    }

    return { mode: 'updated' }
  }

  const { error } = await supabase.from(FEED_TABLES.reactions).insert({
    [REACTION_COLUMNS.postId]: postId,
    [REACTION_COLUMNS.userId]: currentUserId,
    [REACTION_COLUMNS.reactionType]: reactionType,
  })

  if (error) {
    throw error
  }

  const post = await loadPostAuthor(postId)

  if (post?.[POST_COLUMNS.authorUserId] && post[POST_COLUMNS.authorUserId] !== currentUserId) {
    await createNotification({
      userId: String(post[POST_COLUMNS.authorUserId]),
      actorId: currentUserId,
      type: 'post_reacted',
      referenceId: postId,
      payload: {
        post_id: postId,
        post_title: post[POST_COLUMNS.title] || '',
      },
    })
  }

  return { mode: 'created' }
}

export async function createSocialComment(postId: string, currentUserId: string, body: string) {
  const nextBody = body.trim()

  if (!nextBody) {
    throw new Error('댓글 내용을 입력해 주세요.')
  }

  const { data, error } = await supabase
    .from(FEED_TABLES.comments)
    .insert({
      [COMMENT_COLUMNS.postId]: postId,
      [COMMENT_COLUMNS.authorUserId]: currentUserId,
      [COMMENT_COLUMNS.body]: nextBody,
    })
    .select(`${COMMENT_COLUMNS.id}, ${COMMENT_COLUMNS.postId}, ${COMMENT_COLUMNS.authorUserId}, ${COMMENT_COLUMNS.body}, ${COMMENT_COLUMNS.createdAt}`)
    .maybeSingle()

  if (error) {
    throw error
  }

  const post = await loadPostAuthor(postId)

  if (post?.[POST_COLUMNS.authorUserId] && post[POST_COLUMNS.authorUserId] !== currentUserId) {
    await createNotification({
      userId: String(post[POST_COLUMNS.authorUserId]),
      actorId: currentUserId,
      type: 'post_commented',
      referenceId: postId,
      payload: {
        post_id: postId,
        post_title: post[POST_COLUMNS.title] || '',
      },
    })
  }

  return data
}
