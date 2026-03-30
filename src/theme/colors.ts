export const LightColors = {
  // Base
  background: '#F7F7F9',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#D1D5DB',

  // Accent (Indigo)
  accent: '#4F46E5',
  accentMuted: 'rgba(79, 70, 229, 0.10)',

  // Semantic
  success: '#10B981',
  successMuted: 'rgba(16, 185, 129, 0.12)',
  error: '#EF4444',
  errorMuted: 'rgba(239, 68, 68, 0.12)',

  // Macros (채도 높게)
  protein: '#FF6B6B',
  carbs: '#FF9F0A',
  fat: '#BF5AF2',

  // Structure
  border: '#E5E7EB',
  separator: '#F3F4F6',
  trackBg: '#E5E7EB',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
} as const;

export const DarkColors = {
  // Base
  background: '#000000',
  card: '#121212',
  cardElevated: '#1E1E1E',

  // Text
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#4B5563',

  // Accent (Light Indigo)
  accent: '#818CF8',
  accentMuted: 'rgba(129, 140, 248, 0.15)',

  // Semantic
  success: '#34D399',
  successMuted: 'rgba(52, 211, 153, 0.15)',
  error: '#F87171',
  errorMuted: 'rgba(248, 113, 113, 0.15)',

  // Macros
  protein: '#FF6B6B',
  carbs: '#FF9F0A',
  fat: '#BF5AF2',

  // Structure
  border: '#27272A',
  separator: '#18181B',
  trackBg: '#27272A',

  // Tab bar
  tabBar: '#121212',
  tabBarBorder: '#27272A',
} as const;

export type AppColors = { [K in keyof typeof LightColors]: string };
