export const MUSCLE_RECOVERY_PROFILES = {
  chest: { dailyRecovery: 0.22, label: 'Moderate' },
  frontDelts: { dailyRecovery: 0.24, label: 'Fast' },
  middleDelts: { dailyRecovery: 0.26, label: 'Fast' },
  rearDelts: { dailyRecovery: 0.25, label: 'Fast' },
  biceps: { dailyRecovery: 0.3, label: 'Very fast' },
  triceps: { dailyRecovery: 0.3, label: 'Very fast' },
  abs: { dailyRecovery: 0.32, label: 'Very fast' },
  lats: { dailyRecovery: 0.2, label: 'Moderate' },
  upperBack: { dailyRecovery: 0.2, label: 'Moderate' },
  lowerBack: { dailyRecovery: 0.16, label: 'Slow' },
  glutes: { dailyRecovery: 0.2, label: 'Moderate' },
  quadriceps: { dailyRecovery: 0.18, label: 'Slow' },
  hamstrings: { dailyRecovery: 0.18, label: 'Slow' },
  calves: { dailyRecovery: 0.24, label: 'Fast' },
}

export const MUSCLE_RECOVERY_RATES = Object.fromEntries(
  Object.entries(MUSCLE_RECOVERY_PROFILES).map(([muscle, profile]) => [
    muscle,
    Number((1 - profile.dailyRecovery).toFixed(2)),
  ]),
)
