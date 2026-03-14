const ICON_LABELS = {
  add: '+',
  ai: 'AI',
  analytics: 'AN',
  calendar: 'CL',
  chart: 'CH',
  comment: 'CM',
  community: 'CO',
  create: 'CR',
  detail: 'DT',
  diary: 'DY',
  edit: 'ED',
  equipment: 'EQ',
  feed: 'FD',
  hide: 'HD',
  history: 'HI',
  hot: 'HT',
  like: 'LK',
  nutrition: 'NU',
  profile: 'PF',
  program: 'PG',
  recovery: 'RC',
  report: 'RP',
  save: 'SV',
  search: 'SC',
  seller: 'SL',
  share: 'SH',
  shop: 'SP',
  style: 'ST',
  template: 'TP',
  train: 'TR',
  trend: 'TD',
  workout: 'WK',
}

function AppIcon({ name, size = 'md' }) {
  return (
    <span className={`app-icon app-icon-${size}`} aria-hidden="true">
      {ICON_LABELS[name] || name}
    </span>
  )
}

export default AppIcon
