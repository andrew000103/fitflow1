export type MuscleGroupKey =
  | 'shoulders'
  | 'chest'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'back'
  | 'lowerBack'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'

export type FatigueScore = number

export type MuscleFatigueData = Partial<Record<MuscleGroupKey, FatigueScore>>

export type RecoveryView = 'front' | 'back'
