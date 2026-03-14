import { Icons } from '../ui/icons.ts'

function AppIcon({ name, size = 'md' }) {
  const Icon = Icons[name] || Icons.activity
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18

  return (
    <span className={`app-icon app-icon-${size}`} aria-hidden="true">
      <Icon size={iconSize} strokeWidth={2} />
    </span>
  )
}

export default AppIcon
