import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useThemeStore } from '../stores/theme-store';
import { AppColors, DarkColors, LightColors } from './colors';
import { typography } from './typography';

export { DarkColors, LightColors, typography };
export type { AppColors };

export const theme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    full: 9999,
  },
} as const;

/** 컴포넌트 내에서 현재 테마 색상/타이포 가져오기 */
export function useAppTheme() {
  const isDark = useThemeStore((s) => s.isDark);
  const colors: AppColors = isDark ? DarkColors : LightColors;
  return { colors, typography, isDark, ...theme };
}

// ─── React Native Paper 테마 ──────────────────────────────────────────────────

export const paperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: LightColors.accent,
    background: LightColors.background,
    surface: LightColors.card,
    surfaceVariant: LightColors.card,
    onSurface: LightColors.text,
    onBackground: LightColors.text,
    onSurfaceVariant: LightColors.textSecondary,
    outline: LightColors.border,
    error: LightColors.error,
  },
};

export const paperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: DarkColors.accent,
    background: DarkColors.background,
    surface: DarkColors.card,
    surfaceVariant: DarkColors.card,
    onSurface: DarkColors.text,
    onBackground: DarkColors.text,
    onSurfaceVariant: DarkColors.textSecondary,
    outline: DarkColors.border,
    error: DarkColors.error,
  },
};
