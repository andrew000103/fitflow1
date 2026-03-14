import { FRONT_VIEW_GROUPS, BACK_VIEW_GROUPS, getMuscleGroupLabel } from '../../features/recovery/constants.ts'
import { tx } from '../../utils/appLanguage.js'

function MuscleLegend({ appLanguage = 'ko' }) {
  const language = appLanguage === 'ko' ? 'ko' : 'en'
  const frontLabels = FRONT_VIEW_GROUPS.map((group) => getMuscleGroupLabel(group, language)).join(' · ')
  const backLabels = BACK_VIEW_GROUPS.map((group) => getMuscleGroupLabel(group, language)).join(' · ')

  return (
    <div className="muscle-legend">
      <span className="card-kicker">{tx(appLanguage, '피로도 스케일', 'Fatigue scale')}</span>
      <div className="muscle-legend-bar">
        <span style={{ background: '#e5e7eb' }} />
        <span style={{ background: '#fde68a' }} />
        <span style={{ background: '#facc15' }} />
        <span style={{ background: '#f59e0b' }} />
        <span style={{ background: '#d97706' }} />
      </div>
      <div className="muscle-legend-labels">
        <span>{tx(appLanguage, '낮음', 'Low')}</span>
        <span>{tx(appLanguage, '높음', 'High')}</span>
      </div>
      <div className="mini-panel">{tx(appLanguage, `앞면: ${frontLabels}`, `Front: ${frontLabels}`)}</div>
      <div className="mini-panel">{tx(appLanguage, `뒷면: ${backLabels}`, `Back: ${backLabels}`)}</div>
    </div>
  )
}

export default MuscleLegend
