import { supabase } from '../../lib/supabase.js'
import { createNotification } from '../notifications/notificationApi.ts'

export type SupportRelationshipStatus = 'self' | 'supported' | 'not_supported'
export type CrewRelationshipStatus = 'self' | 'crew' | 'incoming_request' | 'outgoing_request' | 'none'

export interface ProfileSocialStats {
  supporterCount: number
  supportingCount: number
  crewCount: number
}

export interface ProfileSocialState {
  supportStatus: SupportRelationshipStatus
  crewStatus: CrewRelationshipStatus
  stats: ProfileSocialStats
}

const SOCIAL_TABLE = 'social_relationships'
const SOCIAL_RELATIONSHIP_EVENT = 'fitflow:social-relationships-changed'

const SOCIAL_COLUMNS = {
  requesterId: 'requester_id',
  addresseeId: 'addressee_id',
  relationType: 'relation_type',
  status: 'status',
  createdAt: 'created_at',
} as const

export function emitSocialRelationshipsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SOCIAL_RELATIONSHIP_EVENT))
  }
}

export function subscribeSocialRelationshipsChanged(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  window.addEventListener(SOCIAL_RELATIONSHIP_EVENT, callback)
  return () => window.removeEventListener(SOCIAL_RELATIONSHIP_EVENT, callback)
}

function buildRelationshipPairFilter(currentUserId: string, profileUserId: string, relationType: 'support' | 'crew') {
  return `and(${SOCIAL_COLUMNS.requesterId}.eq.${currentUserId},${SOCIAL_COLUMNS.addresseeId}.eq.${profileUserId},${SOCIAL_COLUMNS.relationType}.eq.${relationType}),and(${SOCIAL_COLUMNS.requesterId}.eq.${profileUserId},${SOCIAL_COLUMNS.addresseeId}.eq.${currentUserId},${SOCIAL_COLUMNS.relationType}.eq.${relationType})`
}

function normalizeCrewStatus(row: Record<string, string> | null, currentUserId: string): CrewRelationshipStatus {
  if (!row) {
    return 'none'
  }

  const status = row[SOCIAL_COLUMNS.status]
  const requesterId = row[SOCIAL_COLUMNS.requesterId]

  if (status === 'accepted') {
    return 'crew'
  }

  if (status === 'pending') {
    return requesterId === currentUserId ? 'outgoing_request' : 'incoming_request'
  }

  return 'none'
}

export async function getSupportRelationshipStatus(currentUserId: string, profileUserId: string): Promise<SupportRelationshipStatus> {
  if (!currentUserId || !profileUserId) {
    return 'not_supported'
  }

  if (currentUserId === profileUserId) {
    return 'self'
  }

  const { data, error } = await supabase
    .from(SOCIAL_TABLE)
    .select('*')
    .eq(SOCIAL_COLUMNS.requesterId, currentUserId)
    .eq(SOCIAL_COLUMNS.addresseeId, profileUserId)
    .eq(SOCIAL_COLUMNS.relationType, 'support')
    .eq(SOCIAL_COLUMNS.status, 'accepted')
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? 'supported' : 'not_supported'
}

export async function getCrewRelationshipStatus(currentUserId: string, profileUserId: string): Promise<CrewRelationshipStatus> {
  if (!currentUserId || !profileUserId) {
    return 'none'
  }

  if (currentUserId === profileUserId) {
    return 'self'
  }

  const { data, error } = await supabase
    .from(SOCIAL_TABLE)
    .select(`${SOCIAL_COLUMNS.requesterId}, ${SOCIAL_COLUMNS.status}`)
    .or(buildRelationshipPairFilter(currentUserId, profileUserId, 'crew'))
    .order(SOCIAL_COLUMNS.createdAt, { ascending: false })
    .limit(1)

  if (error) {
    throw error
  }

  const latestRelationship = Array.isArray(data) ? data[0] : null
  return normalizeCrewStatus(latestRelationship || null, currentUserId)
}

export async function getProfileSocialStats(profileUserId: string): Promise<ProfileSocialStats> {
  const [supporterResult, supportingResult, crewResult] = await Promise.all([
    supabase
      .from(SOCIAL_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq(SOCIAL_COLUMNS.relationType, 'support')
      .eq(SOCIAL_COLUMNS.status, 'accepted')
      .eq(SOCIAL_COLUMNS.addresseeId, profileUserId),
    supabase
      .from(SOCIAL_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq(SOCIAL_COLUMNS.relationType, 'support')
      .eq(SOCIAL_COLUMNS.status, 'accepted')
      .eq(SOCIAL_COLUMNS.requesterId, profileUserId),
    supabase
      .from(SOCIAL_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq(SOCIAL_COLUMNS.relationType, 'crew')
      .eq(SOCIAL_COLUMNS.status, 'accepted')
      .or(`${SOCIAL_COLUMNS.requesterId}.eq.${profileUserId},${SOCIAL_COLUMNS.addresseeId}.eq.${profileUserId}`),
  ])

  if (supporterResult.error) {
    throw supporterResult.error
  }

  if (supportingResult.error) {
    throw supportingResult.error
  }

  if (crewResult.error) {
    throw crewResult.error
  }

  return {
    supporterCount: supporterResult.count || 0,
    supportingCount: supportingResult.count || 0,
    crewCount: crewResult.count || 0,
  }
}

export async function getProfileSocialState(currentUserId: string, profileUserId: string): Promise<ProfileSocialState> {
  const [supportStatus, crewStatus, stats] = await Promise.all([
    getSupportRelationshipStatus(currentUserId, profileUserId),
    getCrewRelationshipStatus(currentUserId, profileUserId),
    getProfileSocialStats(profileUserId),
  ])

  return {
    supportStatus,
    crewStatus,
    stats,
  }
}

export async function createSupport(currentUserId: string, profileUserId: string) {
  const { error } = await supabase.from(SOCIAL_TABLE).insert({
    [SOCIAL_COLUMNS.requesterId]: currentUserId,
    [SOCIAL_COLUMNS.addresseeId]: profileUserId,
    [SOCIAL_COLUMNS.relationType]: 'support',
    [SOCIAL_COLUMNS.status]: 'accepted',
  })

  if (error) {
    throw error
  }

  await createNotification({
    userId: profileUserId,
    actorId: currentUserId,
    type: 'support_received',
    referenceId: profileUserId,
    payload: {
      relation_type: 'support',
    },
  })

  emitSocialRelationshipsChanged()
}

export async function cancelSupport(currentUserId: string, profileUserId: string) {
  const { error } = await supabase
    .from(SOCIAL_TABLE)
    .delete()
    .eq(SOCIAL_COLUMNS.requesterId, currentUserId)
    .eq(SOCIAL_COLUMNS.addresseeId, profileUserId)
    .eq(SOCIAL_COLUMNS.relationType, 'support')

  if (error) {
    throw error
  }

  emitSocialRelationshipsChanged()
}

export async function sendCrewRequest(currentUserId: string, profileUserId: string) {
  const { error } = await supabase.from(SOCIAL_TABLE).insert({
    [SOCIAL_COLUMNS.requesterId]: currentUserId,
    [SOCIAL_COLUMNS.addresseeId]: profileUserId,
    [SOCIAL_COLUMNS.relationType]: 'crew',
    [SOCIAL_COLUMNS.status]: 'pending',
  })

  if (error) {
    throw error
  }

  await createNotification({
    userId: profileUserId,
    actorId: currentUserId,
    type: 'crew_request_received',
    referenceId: profileUserId,
    payload: {
      relation_type: 'crew',
      status: 'pending',
    },
  })

  emitSocialRelationshipsChanged()
}

export async function acceptCrewRequest(currentUserId: string, profileUserId: string) {
  const { error } = await supabase
    .from(SOCIAL_TABLE)
    .update({
      [SOCIAL_COLUMNS.status]: 'accepted',
    })
    .eq(SOCIAL_COLUMNS.requesterId, profileUserId)
    .eq(SOCIAL_COLUMNS.addresseeId, currentUserId)
    .eq(SOCIAL_COLUMNS.relationType, 'crew')
    .eq(SOCIAL_COLUMNS.status, 'pending')

  if (error) {
    throw error
  }

  await createNotification({
    userId: profileUserId,
    actorId: currentUserId,
    type: 'crew_request_accepted',
    referenceId: currentUserId,
    payload: {
      relation_type: 'crew',
      status: 'accepted',
    },
  })

  emitSocialRelationshipsChanged()
}

export async function declineCrewRequest(currentUserId: string, profileUserId: string) {
  const { error } = await supabase
    .from(SOCIAL_TABLE)
    .update({
      [SOCIAL_COLUMNS.status]: 'declined',
    })
    .eq(SOCIAL_COLUMNS.requesterId, profileUserId)
    .eq(SOCIAL_COLUMNS.addresseeId, currentUserId)
    .eq(SOCIAL_COLUMNS.relationType, 'crew')
    .eq(SOCIAL_COLUMNS.status, 'pending')

  if (error) {
    throw error
  }

  emitSocialRelationshipsChanged()
}

export async function cancelCrewRequest(currentUserId: string, profileUserId: string) {
  const { error } = await supabase
    .from(SOCIAL_TABLE)
    .delete()
    .eq(SOCIAL_COLUMNS.requesterId, currentUserId)
    .eq(SOCIAL_COLUMNS.addresseeId, profileUserId)
    .eq(SOCIAL_COLUMNS.relationType, 'crew')
    .eq(SOCIAL_COLUMNS.status, 'pending')

  if (error) {
    throw error
  }

  emitSocialRelationshipsChanged()
}
