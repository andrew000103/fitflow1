import type { MuscleFatigueData, RecoveryView } from './types'
import BodyRecoveryBack from '../../components/bodymap/BodyRecoveryBack.jsx'
import BodyRecoveryFront from '../../components/bodymap/BodyRecoveryFront.jsx'

type BodyRecoveryMapProps = {
  view?: RecoveryView
  sex?: 'male' | 'female'
  data?: MuscleFatigueData
}

function BodyRecoveryMap({ view = 'front', sex = 'male', data = {} }: BodyRecoveryMapProps) {
  if (view === 'back') {
    return <BodyRecoveryBack sex={sex} data={data} />
  }

  return <BodyRecoveryFront sex={sex} data={data} />
}

export default BodyRecoveryMap
