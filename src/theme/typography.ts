import { Platform } from 'react-native';

// Keep native typography unchanged, but let web fall back to emoji-capable fonts.
const webFontStack =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"';

// SF Pro on iOS, system sans-serif on Android, system+emoji fallback on web
const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: webFontStack,
  default: 'sans-serif',
});

export const typography = {
  fontFamily,
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 48,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export type AppTypography = typeof typography;
