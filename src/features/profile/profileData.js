import { supabase } from '../../lib/supabase'
import { calculateHealthTargets } from '../../lib/healthTargets'

export const emptyProfileForm = {
  age: '',
  heightCm: '',
  weightKg: '',
  gender: 'male',
  activityLevel: 'light',
  goalType: 'cut',
}

export function normalizeProfileForm(profile) {
  return {
    age: profile?.age ? String(profile.age) : '',
    heightCm: profile?.height_cm ? String(profile.height_cm) : '',
    weightKg: profile?.weight_kg ? String(profile.weight_kg) : '',
    gender: profile?.gender || 'male',
    activityLevel: profile?.activity_level || 'light',
    goalType: profile?.goal_type || 'cut',
  }
}

export async function loadProfileBundle(userId) {
  const [profileResult, targetsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('age, height_cm, weight_kg, gender, activity_level, goal_type, onboarding_completed')
      .eq('user_id', userId)
      .maybeSingle(),
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

  const { error: profileError } = await supabase.from('profiles').upsert({
    user_id: userId,
    age,
    height_cm: heightCm,
    weight_kg: weightKg,
    gender: form.gender,
    activity_level: form.activityLevel,
    goal_type: form.goalType,
    onboarding_completed: true,
    updated_at: now,
  })

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
