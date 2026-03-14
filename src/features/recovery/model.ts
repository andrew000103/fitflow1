import type { MuscleFatigueData, MuscleGroupKey } from './types'
import { MUSCLE_GROUP_ORDER } from './constants'

function average(...values: Array<number | undefined>) {
  const safeValues = values.filter((value) => Number.isFinite(value)) as number[]

  if (!safeValues.length) {
    return 0
  }

  return Math.round(safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length)
}

export function createEmptyMuscleFatigueData(): Record<MuscleGroupKey, number> {
  return Object.fromEntries(MUSCLE_GROUP_ORDER.map((group) => [group, 0])) as Record<MuscleGroupKey, number>
}

export function mapLegacyMuscleScoresToRecoveryData(scores: Record<string, number> = {}): MuscleFatigueData {
  return {
    shoulders: average(scores.frontDelts, scores.middleDelts, scores.rearDelts),
    chest: average(scores.chest),
    biceps: average(scores.biceps),
    triceps: average(scores.triceps),
    forearms: average(scores.forearms, scores.biceps ? scores.biceps * 0.45 : undefined),
    abs: average(scores.abs),
    back: average(scores.lats, scores.upperBack),
    lowerBack: average(scores.lowerBack),
    glutes: average(scores.glutes),
    quads: average(scores.quadriceps),
    hamstrings: average(scores.hamstrings),
    calves: average(scores.calves),
  }
}

export function buildRecoveryRows(data: MuscleFatigueData = {}) {
  return MUSCLE_GROUP_ORDER.map((group) => ({
    muscle: group,
    score: Math.round(data[group] || 0),
  })).sort((left, right) => right.score - left.score)
}
