export function clampFatigueScore(score: number = 0) {
  return Math.min(100, Math.max(0, Math.round(score || 0)))
}

export function getRecoveryColor(score: number = 0) {
  const normalized = clampFatigueScore(score)

  if (normalized >= 85) return '#b93815'
  if (normalized >= 70) return '#d95b18'
  if (normalized >= 50) return '#ea8f22'
  if (normalized >= 30) return '#f2c45a'
  if (normalized >= 15) return '#f3df9d'
  return '#e6e8ee'
}

export function getRecoveryToneLabel(score: number = 0, language: 'ko' | 'en' = 'ko') {
  const normalized = clampFatigueScore(score)

  if (language === 'en') {
    if (normalized >= 75) return 'High fatigue'
    if (normalized >= 45) return 'Moderate fatigue'
    return 'Low fatigue'
  }

  if (normalized >= 75) return '피로 높음'
  if (normalized >= 45) return '피로 보통'
  return '피로 낮음'
}
