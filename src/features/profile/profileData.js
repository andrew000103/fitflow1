import { supabase } from '../../lib/supabase'
import { calculateHealthTargets } from '../../lib/healthTargets'

export const emptyProfileForm = {
  nickname: '',
  age: '',
  heightCm: '',
  weightKg: '',
  gender: 'male',
  activityLevel: 'light',
  goalType: 'cut',
}

function isMissingNicknameColumnError(error) {
  const message = String(error?.message || '')
  return message.includes("Could not find the 'nickname' column") || (
    message.includes('nickname') && message.includes('schema cache')
  )
}

async function callNicknameRpc(functionName, nickname) {
  const payloadCandidates = [
    { nickname },
    { nickname_input: nickname },
    { input_nickname: nickname },
    { desired_nickname: nickname },
  ]

  let lastError = null

  for (const payload of payloadCandidates) {
    const result = await supabase.rpc(functionName, payload)

    if (!result.error) {
      return result
    }

    lastError = result.error

    const errorMessage = String(result.error?.message || '')
    const isArgumentMismatch =
      errorMessage.includes('function') ||
      errorMessage.includes('parameter') ||
      errorMessage.includes('argument') ||
      errorMessage.includes('schema cache')

    if (!isArgumentMismatch) {
      throw result.error
    }
  }

  throw lastError || new Error(`RPC ${functionName} failed.`)
}

export function normalizeProfileForm(profile) {
  return {
    nickname: profile?.nickname || '',
    age: profile?.age ? String(profile.age) : '',
    heightCm: profile?.height_cm ? String(profile.height_cm) : '',
    weightKg: profile?.weight_kg ? String(profile.weight_kg) : '',
    gender: profile?.gender || 'male',
    activityLevel: profile?.activity_level || 'light',
    goalType: profile?.goal_type || 'cut',
  }
}

async function loadProfileRecord(userId) {
  const profileResult = await supabase
    .from('profiles')
    .select('nickname, age, height_cm, weight_kg, gender, activity_level, goal_type, onboarding_completed')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profileResult.error) {
    return profileResult
  }

  if (!isMissingNicknameColumnError(profileResult.error)) {
    return profileResult
  }

  const fallbackResult = await supabase
    .from('profiles')
    .select('age, height_cm, weight_kg, gender, activity_level, goal_type, onboarding_completed')
    .eq('user_id', userId)
    .maybeSingle()

  if (!fallbackResult.error && fallbackResult.data) {
    fallbackResult.data = {
      ...fallbackResult.data,
      nickname: '',
    }
  }

  return fallbackResult
}

export async function loadProfileBundle(userId) {
  const [profileResult, targetsResult] = await Promise.all([
    loadProfileRecord(userId),
    supabase
      .from('user_targets')
      .select('target_calories, target_protein_g, target_steps, target_workouts_per_week')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (profileResult.error) {
    throw profileResult.error
  }

  if (targetsResult.error) {
    throw targetsResult.error
  }

  return {
    profile: profileResult.data || null,
    targets: targetsResult.data || null,
  }
}

export function calculateProfileTargets(form) {
  const age = Number(form.age)
  const heightCm = Number(form.heightCm)
  const weightKg = Number(form.weightKg)

  if (!age || !heightCm || !weightKg) {
    return null
  }

  return calculateHealthTargets({
    age,
    heightCm,
    weightKg,
    gender: form.gender,
    activityLevel: form.activityLevel,
    goalType: form.goalType,
  })
}

export async function saveProfileBundle(userId, form) {
  const age = Number(form.age)
  const heightCm = Number(form.heightCm)
  const weightKg = Number(form.weightKg)
  const nextTargets = calculateProfileTargets(form)
  const now = new Date().toISOString()

  if (!nextTargets) {
    throw new Error('Missing required body metrics.')
  }

  const profilePayload = {
    user_id: userId,
    nickname: form.nickname?.trim() || null,
    age,
    height_cm: heightCm,
    weight_kg: weightKg,
    gender: form.gender,
    activity_level: form.activityLevel,
    goal_type: form.goalType,
    onboarding_completed: true,
    updated_at: now,
  }

  let { error: profileError } = await supabase.from('profiles').upsert(profilePayload)

  if (profileError && isMissingNicknameColumnError(profileError)) {
    const { nickname, ...fallbackPayload } = profilePayload
    ;({ error: profileError } = await supabase.from('profiles').upsert(fallbackPayload))
  }

  if (profileError) {
    throw profileError
  }

  const { error: targetsError } = await supabase.from('user_targets').upsert({
    user_id: userId,
    target_calories: nextTargets.targetCalories,
    target_protein_g: nextTargets.targetProteinG,
    target_steps: nextTargets.targetSteps,
    target_workouts_per_week: nextTargets.targetWorkoutsPerWeek,
    updated_at: now,
  })

  if (targetsError) {
    throw targetsError
  }

  return {
    profile: {
      nickname: form.nickname?.trim() || '',
      age,
      height_cm: heightCm,
      weight_kg: weightKg,
      gender: form.gender,
      activity_level: form.activityLevel,
      goal_type: form.goalType,
      onboarding_completed: true,
    },
    targets: {
      target_calories: nextTargets.targetCalories,
      target_protein_g: nextTargets.targetProteinG,
      target_steps: nextTargets.targetSteps,
      target_workouts_per_week: nextTargets.targetWorkoutsPerWeek,
    },
  }
}

export async function checkNicknameAvailability(userId, nickname) {
  const normalizedNickname = String(nickname || '').trim()

  if (!normalizedNickname) {
    return {
      available: false,
      supported: true,
      message: 'Nickname is required.',
    }
  }

  const { data } = await callNicknameRpc('is_nickname_available', normalizedNickname)
  const available =
    typeof data === 'boolean'
      ? data
      : typeof data?.available === 'boolean'
      ? data.available
      : typeof data?.is_available === 'boolean'
      ? data.is_available
      : false

  if (!available) {
    return {
      available: false,
      supported: true,
      message: 'Nickname already exists.',
    }
  }

  return {
    available: true,
    supported: true,
    message: 'Nickname is available.',
  }
}

export async function suggestNicknames(nickname) {
  const normalizedNickname = String(nickname || '').trim()

  if (!normalizedNickname) {
    return []
  }

  const { data } = await callNicknameRpc('suggest_nicknames', normalizedNickname)
  const rawSuggestions = Array.isArray(data)
    ? data
    : Array.isArray(data?.suggestions)
    ? data.suggestions
    : Array.isArray(data?.nicknames)
    ? data.nicknames
    : []

  return rawSuggestions
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 5)
}

export async function deleteProfileBundle(userId) {
  const { error: targetsError } = await supabase
    .from('user_targets')
    .delete()
    .eq('user_id', userId)

  if (targetsError) {
    throw targetsError
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('user_id', userId)

  if (profileError) {
    throw profileError
  }
}
