export const MUSCLE_LABELS = {
  chest: 'Chest',
  frontDelts: 'Front Delts',
  middleDelts: 'Middle Delts',
  rearDelts: 'Rear Delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abs: 'Abs',
  lats: 'Lats',
  upperBack: 'Upper Back',
  lowerBack: 'Lower Back',
  glutes: 'Glutes',
  quadriceps: 'Quadriceps',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
}

export const CATEGORY_MUSCLE_FALLBACKS = {
  chest: { chest: 0.65, frontDelts: 0.2, triceps: 0.15 },
  shoulders: { frontDelts: 0.28, middleDelts: 0.38, rearDelts: 0.22, triceps: 0.12 },
  back: { lats: 0.45, upperBack: 0.35, biceps: 0.12, lowerBack: 0.08 },
  legs: { quadriceps: 0.34, glutes: 0.28, hamstrings: 0.2, calves: 0.08, abs: 0.1 },
  abs: { abs: 0.8, lowerBack: 0.1, frontDelts: 0.1 },
  arms: { biceps: 0.35, triceps: 0.45, frontDelts: 0.08, middleDelts: 0.05, rearDelts: 0.07 },
}

export const EXERCISE_MUSCLE_MAP = {
  bench_press: { chest: 0.6, frontDelts: 0.2, triceps: 0.2 },
  incline_bench_press: { chest: 0.45, frontDelts: 0.35, triceps: 0.2 },
  incline_dumbbell_press: { chest: 0.48, frontDelts: 0.32, triceps: 0.2 },
  cable_fly: { chest: 0.8, frontDelts: 0.2 },
  chest_press_machine: { chest: 0.6, frontDelts: 0.15, triceps: 0.25 },
  overhead_press: { frontDelts: 0.45, middleDelts: 0.2, triceps: 0.25, upperBack: 0.1 },
  seated_dumbbell_press: { frontDelts: 0.42, middleDelts: 0.22, triceps: 0.24, upperBack: 0.12 },
  lateral_raise: { middleDelts: 0.78, rearDelts: 0.12, frontDelts: 0.1 },
  rear_delt_fly: { rearDelts: 0.65, upperBack: 0.35 },
  face_pull: { rearDelts: 0.45, upperBack: 0.45, middleDelts: 0.1 },
  lat_pulldown: { lats: 0.7, upperBack: 0.2, biceps: 0.1 },
  barbell_row: { lats: 0.4, upperBack: 0.4, biceps: 0.1, lowerBack: 0.1 },
  seated_cable_row: { lats: 0.4, upperBack: 0.4, biceps: 0.15, rearDelts: 0.05 },
  one_arm_dumbbell_row: { lats: 0.5, upperBack: 0.25, biceps: 0.15, lowerBack: 0.1 },
  pull_up: { lats: 0.65, upperBack: 0.2, biceps: 0.15 },
  back_squat: { quadriceps: 0.45, glutes: 0.3, hamstrings: 0.15, abs: 0.1 },
  front_squat: { quadriceps: 0.5, glutes: 0.18, abs: 0.2, hamstrings: 0.12 },
  leg_press: { quadriceps: 0.5, glutes: 0.25, hamstrings: 0.15, calves: 0.1 },
  romanian_deadlift: { hamstrings: 0.42, glutes: 0.3, lowerBack: 0.18, upperBack: 0.1 },
  bulgarian_split_squat: { quadriceps: 0.4, glutes: 0.32, hamstrings: 0.18, calves: 0.1 },
  cable_crunch: { abs: 0.8, lowerBack: 0.2 },
  hanging_leg_raise: { abs: 0.78, lats: 0.08, frontDelts: 0.14 },
  ab_wheel_rollout: { abs: 0.58, lowerBack: 0.22, frontDelts: 0.2 },
  plank: { abs: 0.62, lowerBack: 0.18, glutes: 0.1, frontDelts: 0.1 },
  reverse_crunch: { abs: 0.84, lowerBack: 0.16 },
  barbell_curl: { biceps: 0.74, frontDelts: 0.06, upperBack: 0.05, triceps: 0.15 },
  hammer_curl: { biceps: 0.6, rearDelts: 0.06, upperBack: 0.06, triceps: 0.28 },
  tricep_pushdown: { triceps: 0.8, frontDelts: 0.1, chest: 0.1 },
  skull_crusher: { triceps: 0.84, frontDelts: 0.08, chest: 0.08 },
  close_grip_bench_press: { triceps: 0.5, chest: 0.3, frontDelts: 0.2 },
}

export function normalizeExerciseKey(name = '') {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}
