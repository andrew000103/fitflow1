export const LightColors = {
  // Base
  background: '#FFFFFF',
  card: '#F8F8F8',
  cardElevated: '#FFFFFF',

  // Text
  text: '#1A1A1A',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',

  // Accent (iOS Blue)
  accent: '#007AFF',
  accentMuted: 'rgba(0, 122, 255, 0.10)',

  // Semantic
  success: '#34C759',
  successMuted: 'rgba(52, 199, 89, 0.12)',
  error: '#FF3B30',
  errorMuted: 'rgba(255, 59, 48, 0.12)',

  // Macros (채도 높게)
  protein: '#FF6B6B',
  carbs: '#FF9F0A',
  fat: '#BF5AF2',

  // Structure
  border: '#E5E5EA',
  separator: '#F2F2F7',
  trackBg: '#E5E5EA',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E5EA',
} as const;

export const DarkColors = {
  // Base
  background: '#0D0D0D',
  card: '#1C1C1E',
  cardElevated: '#2C2C2E',

  // Text
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#48484A',

  // Accent (iOS Dark Blue)
  accent: '#0A84FF',
  accentMuted: 'rgba(10, 132, 255, 0.15)',

  // Semantic
  success: '#30D158',
  successMuted: 'rgba(48, 209, 88, 0.15)',
  error: '#FF453A',
  errorMuted: 'rgba(255, 69, 58, 0.15)',

  // Macros
  protein: '#FF6B6B',
  carbs: '#FF9F0A',
  fat: '#BF5AF2',

  // Structure
  border: '#2C2C2E',
  separator: '#1C1C1E',
  trackBg: '#2C2C2E',

  // Tab bar
  tabBar: '#1C1C1E',
  tabBarBorder: '#2C2C2E',
} as const;

export type AppColors = { [K in keyof typeof LightColors]: string };
