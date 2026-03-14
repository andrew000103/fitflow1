import { FRONT_VIEW_GROUPS, BACK_VIEW_GROUPS } from '../../features/recovery/constants.ts'
import { getRecoveryColor } from '../../features/recovery/colorScale.ts'
import { mapLegacyMuscleScoresToRecoveryData } from '../../features/recovery/model.ts'

export const FRONT_REGIONS = FRONT_VIEW_GROUPS
export const BACK_REGIONS = BACK_VIEW_GROUPS

export function mapLegacyScoresToBodyRecoveryData(scores = {}) {
  return mapLegacyMuscleScoresToRecoveryData(scores)
}

export function getRecoveryRegionColor(data, regionKey) {
  return getRecoveryColor(data?.[regionKey] || 0)
}
