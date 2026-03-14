import { createElement } from 'react'

// TODO: This file is intentionally shaped to mirror a future lucide-react migration.
// The current environment does not have npm installed, so lucide-react could not be added here.
// Once package installation is available, replace these internal icons with lucide-react exports.

type IconProps = {
  size?: number
  strokeWidth?: number
  className?: string
}

type Shape =
  | { type: 'path'; d: string }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'circle'; cx: number; cy: number; r: number }
  | { type: 'polyline'; points: string }
  | { type: 'rect'; x: number; y: number; width: number; height: number; rx?: number; ry?: number }

function createIcon(shapes: Shape[]) {
  return function Icon({ size = 20, strokeWidth = 2, className }: IconProps) {
    return createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className,
        'aria-hidden': true,
      },
      shapes.map((shape, index) => createElement(shape.type, { key: index, ...shape })),
    )
  }
}

const Dumbbell = createIcon([
  { type: 'line', x1: 4, y1: 10, x2: 4, y2: 14 },
  { type: 'line', x1: 7, y1: 8, x2: 7, y2: 16 },
  { type: 'line', x1: 17, y1: 8, x2: 17, y2: 16 },
  { type: 'line', x1: 20, y1: 10, x2: 20, y2: 14 },
  { type: 'line', x1: 7, y1: 12, x2: 17, y2: 12 },
  { type: 'line', x1: 2, y1: 12, x2: 4, y2: 12 },
  { type: 'line', x1: 20, y1: 12, x2: 22, y2: 12 },
])

const Apple = createIcon([
  { type: 'path', d: 'M12 8c-2.6 0-5 1.8-5 5.6 0 3.1 1.9 6.4 5 6.4s5-3.3 5-6.4C17 9.8 14.6 8 12 8Z' },
  { type: 'path', d: 'M12.3 5.5c.4-1.1 1.3-1.9 2.4-2.2' },
  { type: 'path', d: 'M11.7 5.5C11.2 4.4 10.3 3.6 9.2 3.3' },
  { type: 'path', d: 'M12 8c.7-1 1.6-1.6 2.8-1.6' },
])

const Users = createIcon([
  { type: 'circle', cx: 9, cy: 8, r: 3 },
  { type: 'path', d: 'M4 19c0-2.6 2.2-4.5 5-4.5s5 1.9 5 4.5' },
  { type: 'circle', cx: 17.5, cy: 9.5, r: 2.5 },
  { type: 'path', d: 'M15.5 18.5c.4-1.6 1.8-2.8 3.8-2.8 1.4 0 2.4.4 3.2 1.3' },
])

const ShoppingBag = createIcon([
  { type: 'path', d: 'M6 8h12l-1 12H7L6 8Z' },
  { type: 'path', d: 'M9 8a3 3 0 0 1 6 0' },
])

const User = createIcon([
  { type: 'circle', cx: 12, cy: 8, r: 3.5 },
  { type: 'path', d: 'M5 20c.9-3.3 3.6-5 7-5s6.1 1.7 7 5' },
])

const Flame = createIcon([
  { type: 'path', d: 'M12 3c2 2.4 3.5 4.9 3.5 7.3A3.5 3.5 0 0 1 12 13.8a3.5 3.5 0 0 1-3.5-3.5C8.5 8 9.4 6 12 3Z' },
  { type: 'path', d: 'M8 15.2c0-1.8 1.1-3.3 2.5-4.3.7 1.5 1.6 2.3 3.1 3.4 1 .8 1.4 1.8 1.4 3A3.5 3.5 0 0 1 11.5 21 3.5 3.5 0 0 1 8 17.3v-2.1Z' },
])

const Activity = createIcon([
  { type: 'polyline', points: '3 12 7 12 10 7 14 17 17 12 21 12' },
])

const Clock = createIcon([
  { type: 'circle', cx: 12, cy: 12, r: 8.5 },
  { type: 'line', x1: 12, y1: 7.5, x2: 12, y2: 12 },
  { type: 'line', x1: 12, y1: 12, x2: 15.5, y2: 14 },
])

const Heart = createIcon([
  { type: 'path', d: 'M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.3A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z' },
])

const Target = createIcon([
  { type: 'circle', cx: 12, cy: 12, r: 7.5 },
  { type: 'circle', cx: 12, cy: 12, r: 3.5 },
  { type: 'line', x1: 12, y1: 2.5, x2: 12, y2: 5 },
  { type: 'line', x1: 21.5, y1: 12, x2: 19, y2: 12 },
])

const Plus = createIcon([
  { type: 'line', x1: 12, y1: 5, x2: 12, y2: 19 },
  { type: 'line', x1: 5, y1: 12, x2: 19, y2: 12 },
])

const Search = createIcon([
  { type: 'circle', cx: 11, cy: 11, r: 6 },
  { type: 'line', x1: 16, y1: 16, x2: 21, y2: 21 },
])

const Settings = createIcon([
  { type: 'circle', cx: 12, cy: 12, r: 3 },
  { type: 'path', d: 'M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7.7 7.7 0 0 0-1.8-1l-.3-2.5h-4l-.3 2.5c-.6.2-1.2.5-1.8 1l-2.3-1-2 3.4L5.1 11A7 7 0 0 0 5 12c0 .3 0 .7.1 1l-2 1.5 2 3.4 2.3-1c.5.4 1.1.7 1.8 1l.3 2.5h4l.3-2.5c.7-.2 1.3-.5 1.8-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z' },
])

const Calendar = createIcon([
  { type: 'rect', x: 4, y: 5, width: 16, height: 15, rx: 2 },
  { type: 'line', x1: 8, y1: 3, x2: 8, y2: 7 },
  { type: 'line', x1: 16, y1: 3, x2: 16, y2: 7 },
  { type: 'line', x1: 4, y1: 10, x2: 20, y2: 10 },
])

const BarChart3 = createIcon([
  { type: 'line', x1: 5, y1: 20, x2: 5, y2: 10 },
  { type: 'line', x1: 12, y1: 20, x2: 12, y2: 6 },
  { type: 'line', x1: 19, y1: 20, x2: 19, y2: 13 },
])

const Sparkles = createIcon([
  { type: 'path', d: 'M12 4l1.4 3.6L17 9l-3.6 1.4L12 14l-1.4-3.6L7 9l3.6-1.4L12 4Z' },
  { type: 'path', d: 'M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z' },
  { type: 'path', d: 'M5.5 14.5l.8 2 .2.1 2 .8-2 .8-.1.2-.8 2-.8-2-.2-.1-2-.8 2-.8.1-.2.8-2Z' },
])

const MessageCircle = createIcon([
  { type: 'path', d: 'M5 17l-.8 3L7.8 18H12a7 7 0 1 0 0-14H10a7 7 0 0 0-5 12.1Z' },
])

const Pencil = createIcon([
  { type: 'path', d: 'M4 20l4.5-1 9.3-9.3a1.7 1.7 0 0 0 0-2.4l-1.1-1.1a1.7 1.7 0 0 0-2.4 0L5 15.5 4 20Z' },
  { type: 'line', x1: 13.5, y1: 7.5, x2: 16.5, y2: 10.5 },
])

const ImageIcon = createIcon([
  { type: 'rect', x: 4, y: 5, width: 16, height: 14, rx: 2 },
  { type: 'circle', cx: 9, cy: 10, r: 1.5 },
  { type: 'path', d: 'M6 17l4-4 3 3 2-2 3 3' },
])

const Bookmark = createIcon([
  { type: 'path', d: 'M7 4h10v16l-5-3-5 3V4Z' },
])

const Share2 = createIcon([
  { type: 'circle', cx: 18, cy: 5, r: 2 },
  { type: 'circle', cx: 6, cy: 12, r: 2 },
  { type: 'circle', cx: 18, cy: 19, r: 2 },
  { type: 'line', x1: 8, y1: 11, x2: 16, y2: 6 },
  { type: 'line', x1: 8, y1: 13, x2: 16, y2: 18 },
])

const EyeOff = createIcon([
  { type: 'path', d: 'M3 3l18 18' },
  { type: 'path', d: 'M10.6 10.6a2 2 0 0 0 2.8 2.8' },
  { type: 'path', d: 'M9.9 5.1A10.6 10.6 0 0 1 12 5c5 0 9 3.5 10 7-.5 1.6-1.6 3.1-3.2 4.3' },
  { type: 'path', d: 'M6.2 6.2C4.2 7.5 2.8 9.1 2 12c1 3.5 5 7 10 7 1.7 0 3.2-.3 4.6-.9' },
])

const Flag = createIcon([
  { type: 'line', x1: 6, y1: 3, x2: 6, y2: 21 },
  { type: 'path', d: 'M6 4h10l-2.2 3L16 10H6' },
])

const PackageIcon = createIcon([
  { type: 'path', d: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z' },
  { type: 'line', x1: 12, y1: 3, x2: 12, y2: 21 },
  { type: 'line', x1: 4, y1: 7.5, x2: 20, y2: 7.5 },
])

const Wand2 = createIcon([
  { type: 'path', d: 'M4 20l9-9' },
  { type: 'path', d: 'M14 5l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z' },
  { type: 'path', d: 'M18 12l.6 1.4L20 14l-1.4.6L18 16l-.6-1.4L16 14l1.4-.6L18 12Z' },
])

const History = createIcon([
  { type: 'path', d: 'M4 12a8 8 0 1 0 2.3-5.7' },
  { type: 'line', x1: 4, y1: 4, x2: 4, y2: 9 },
  { type: 'line', x1: 4, y1: 9, x2: 9, y2: 9 },
  { type: 'line', x1: 12, y1: 8, x2: 12, y2: 12 },
  { type: 'line', x1: 12, y1: 12, x2: 15, y2: 14 },
])

const ClipboardList = createIcon([
  { type: 'rect', x: 6, y: 4, width: 12, height: 16, rx: 2 },
  { type: 'path', d: 'M9 4.5h6v3H9z' },
  { type: 'line', x1: 9, y1: 11, x2: 15, y2: 11 },
  { type: 'line', x1: 9, y1: 15, x2: 15, y2: 15 },
])

const ChevronLeft = createIcon([{ type: 'polyline', points: '15 18 9 12 15 6' }])
const ChevronRight = createIcon([{ type: 'polyline', points: '9 18 15 12 9 6' }])
const Menu = createIcon([
  { type: 'line', x1: 4, y1: 7, x2: 20, y2: 7 },
  { type: 'line', x1: 4, y1: 12, x2: 20, y2: 12 },
  { type: 'line', x1: 4, y1: 17, x2: 20, y2: 17 },
])
const RotateCw = createIcon([
  { type: 'path', d: 'M20 12a8 8 0 1 1-2.3-5.7' },
  { type: 'polyline', points: '20 4 20 10 14 10' },
])
const Play = createIcon([{ type: 'path', d: 'M8 6l10 6-10 6V6Z' }])
const TrendingUp = createIcon([
  { type: 'polyline', points: '4 16 10 10 14 14 20 8' },
  { type: 'polyline', points: '14 8 20 8 20 14' },
])

export const Icons = {
  train: Dumbbell,
  nutrition: Apple,
  connect: Users,
  shop: ShoppingBag,
  profile: User,
  calories: Flame,
  activity: Activity,
  time: Clock,
  health: Heart,
  goal: Target,
  add: Plus,
  search: Search,
  settings: Settings,
  calendar: Calendar,
  stats: BarChart3,
  analytics: BarChart3,
  chart: BarChart3,
  ai: Sparkles,
  comment: MessageCircle,
  community: Users,
  create: Pencil,
  detail: ClipboardList,
  diary: ClipboardList,
  edit: Pencil,
  equipment: PackageIcon,
  feed: Users,
  hide: EyeOff,
  history: History,
  image: ImageIcon,
  like: Heart,
  program: ClipboardList,
  recovery: Heart,
  report: Flag,
  save: Bookmark,
  searchFood: Search,
  seller: ShoppingBag,
  share: Share2,
  shopBag: ShoppingBag,
  style: Wand2,
  template: ClipboardList,
  trend: TrendingUp,
  workout: Activity,
  menu: Menu,
  back: ChevronLeft,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  refresh: RotateCw,
  play: Play,
}

export default Icons
