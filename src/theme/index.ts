import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useThemeStore } from '../stores/theme-store';
import { AppColors, DarkColors, LightColors } from './colors';
import { typography } from './typography';

export { DarkColors, LightColors, typography };
export type { AppColors };

/** 컴포넌트 내에서 현재 테마 색상/타이포 가져오기 */
export function useAppTheme() {
  const isDark = useThemeStore((s) => s.isDark);
  const colors: AppColors = isDark ? DarkColors : LightColors;
  return { colors, typography, isDark };
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
