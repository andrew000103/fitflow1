import type { MuscleGroupKey, RecoveryView } from './types'

export const MUSCLE_GROUP_ORDER: MuscleGroupKey[] = [
  'shoulders',
  'chest',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'back',
  'lowerBack',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
]

export const FRONT_VIEW_GROUPS: MuscleGroupKey[] = [
  'shoulders',
  'chest',
  'biceps',
  'forearms',
  'abs',
  'quads',
  'calves',
]

export const BACK_VIEW_GROUPS: MuscleGroupKey[] = [
  'shoulders',
  'triceps',
  'back',
  'lowerBack',
  'glutes',
  'hamstrings',
  'calves',
]

export const VIEW_GROUPS: Record<RecoveryView, MuscleGroupKey[]> = {
  front: FRONT_VIEW_GROUPS,
  back: BACK_VIEW_GROUPS,
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroupKey, { ko: string; en: string }> = {
  shoulders: { ko: '어깨', en: 'Shoulders' },
  chest: { ko: '가슴', en: 'Chest' },
  biceps: { ko: '이두', en: 'Biceps' },
  triceps: { ko: '삼두', en: 'Triceps' },
  forearms: { ko: '전완', en: 'Forearms' },
  abs: { ko: '복부', en: 'Abs' },
  back: { ko: '등', en: 'Back' },
  lowerBack: { ko: '허리', en: 'Lower back' },
  glutes: { ko: '둔근', en: 'Glutes' },
  quads: { ko: '대퇴사두', en: 'Quads' },
  hamstrings: { ko: '햄스트링', en: 'Hamstrings' },
  calves: { ko: '종아리', en: 'Calves' },
}

export function getMuscleGroupLabel(group: MuscleGroupKey, language: 'ko' | 'en' = 'ko') {
  return MUSCLE_GROUP_LABELS[group]?.[language] || group
}
