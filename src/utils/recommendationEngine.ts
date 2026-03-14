import type { GoalType, MuscleGroup } from './fitnessMetrics'

export interface WorkoutRecommendationInput {
  recentMuscles: MuscleGroup[]
  fatigueByMuscle: Partial<Record<MuscleGroup, number>>
  availableMinutes: number
  programMuscles?: MuscleGroup[]
  consecutiveTrainingDays: number
}

export interface MealRecommendationInput {
  remainingCalories: number
  remainingCarbs: number
  remainingProtein: number
  remainingFat: number
  goalType: GoalType
  timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

export interface CommunityRecommendationInput {
  goalType: GoalType
  interactionTags: string[]
  recentMuscles: MuscleGroup[]
}

export interface RecommendationResult {
  title: string
  message: string
  reasons: string[]
}

const muscleLabels: Record<MuscleGroup, string> = {
  chest: '가슴',
  front_delts: '전면 어깨',
  middle_delts: '측면 어깨',
  rear_delts: '후면 어깨',
  biceps: '이두',
  triceps: '삼두',
  forearms: '전완',
  lats: '광배',
  upper_back: '상부 등',
  lower_back: '하부 등',
  neck: '목',
  abs: '복근',
  glutes: '둔근',
  hamstrings: '햄스트링',
  quadriceps: '대퇴사두',
}

function averageFatigue(
  fatigueByMuscle: Partial<Record<MuscleGroup, number>>,
  muscles: MuscleGroup[],
) {
  if (muscles.length === 0) {
    return 0
  }
  const total = muscles.reduce((sum, muscle) => sum + Number(fatigueByMuscle[muscle] || 0), 0)
  return total / muscles.length
}

function unique<T>(items: T[]) {
  return [...new Set(items)]
}

export function recommendTodayWorkout(input: WorkoutRecommendationInput): RecommendationResult {
  const upperGroup: MuscleGroup[] = ['chest', 'lats', 'upper_back', 'biceps', 'triceps', 'front_delts', 'middle_delts', 'rear_delts']
  const lowerGroup: MuscleGroup[] = ['quadriceps', 'glutes', 'hamstrings', 'lower_back']
  const upperFatigue = averageFatigue(input.fatigueByMuscle, upperGroup)
  const lowerFatigue = averageFatigue(input.fatigueByMuscle, lowerGroup)
  const recentUnique = unique(input.recentMuscles)

  if (input.consecutiveTrainingDays >= 2 && upperFatigue >= 60 && lowerFatigue >= 60) {
    return {
      title: '휴식 권장',
      message: '최근 2일 연속 운동했고 상하체 피로가 모두 높아 오늘은 휴식 또는 가벼운 회복 세션을 권장합니다.',
      reasons: ['consecutive_training', 'global_high_fatigue'],
    }
  }

  const preferredPool =
    lowerFatigue > upperFatigue
      ? ['lats', 'biceps', 'upper_back']
      : ['quadriceps', 'glutes', 'hamstrings']
  const programPreferred = (input.programMuscles || []).filter(
    (muscle) => Number(input.fatigueByMuscle[muscle] || 0) < 75,
  )
  const selected = unique(programPreferred.length > 0 ? programPreferred : preferredPool).slice(0, 2)
  const selectedLabel = selected.map((muscle) => muscleLabels[muscle]).join('/')

  const timeMessage =
    input.availableMinutes < 35
      ? '오늘 가능한 시간이 짧아 메인 운동 2~3개 중심의 압축 루틴이 적절합니다.'
      : '충분한 시간이 있어 프로그램 기준 메인 + 보조 운동까지 수행할 수 있습니다.'

  return {
    title: '오늘 운동 추천',
    message: `오늘은 ${selectedLabel} 위주를 추천합니다. ${timeMessage}`,
    reasons: ['muscle_fatigue_balance', 'program_priority', 'available_time'],
  }
}

export function recommendMeal(input: MealRecommendationInput): RecommendationResult {
  const proteinPriority = input.remainingProtein >= Math.max(25, input.remainingCarbs * 0.4)

  if (input.goalType === 'cut' && input.timeOfDay === 'snack') {
    return {
      title: '간식 추천',
      message: '감량 중이므로 간식은 200kcal 이내의 고단백 옵션을 추천합니다.',
      reasons: ['goal_cut', 'snack_limit'],
    }
  }

  if (input.timeOfDay === 'dinner' && proteinPriority) {
    return {
      title: '저녁 추천',
      message: '저녁은 고단백 저지방 식사를 추천합니다. 남은 단백질을 먼저 채우고 탄수화물은 과하지 않게 맞추세요.',
      reasons: ['high_protein_remaining', 'dinner_window'],
    }
  }

  if (input.goalType === 'bulk') {
    return {
      title: '벌크업 식사 추천',
      message: '벌크업 단계이므로 탄수화물과 단백질을 함께 확보하는 식사를 추천합니다.',
      reasons: ['goal_bulk', 'surplus_target'],
    }
  }

  return {
    title: '균형 식사 추천',
    message: `남은 칼로리 ${Math.max(0, Math.round(input.remainingCalories))}kcal 범위에서 탄단지 균형 식사를 추천합니다.`,
    reasons: ['balanced_target'],
  }
}

export function recommendCommunityContent(
  input: CommunityRecommendationInput,
): RecommendationResult {
  const base =
    input.goalType === 'cut'
      ? '감량 레시피와 저칼로리 고단백 식단'
      : input.goalType === 'bulk'
        ? '벌크업 식단 루틴과 고중량 성장 기록'
        : '유지용 균형 식단과 중간 강도 루틴'

  const muscleFocus = unique(input.recentMuscles)
    .slice(0, 2)
    .map((muscle) => muscleLabels[muscle])
    .join(', ')

  const interactionHint = input.interactionTags.length > 0 ? `${input.interactionTags[0]} 관련 콘텐츠` : '운동 팁 콘텐츠'

  return {
    title: '개인화 피드 추천',
    message: `${base}, ${interactionHint}${muscleFocus ? `, 최근 수행한 ${muscleFocus} 관련 팁` : ''}을 우선 노출합니다.`,
    reasons: ['goal_type', 'interaction_history', 'recent_muscles'],
  }
}
