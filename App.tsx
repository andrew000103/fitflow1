import React from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/root-navigator';
import { useThemeStore } from './src/stores/theme-store';
import { DarkColors, LightColors, paperDarkTheme, paperLightTheme } from './src/theme';

function WebAppFrame({ isDark, children }: { isDark: boolean; children: React.ReactNode }) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const colors = isDark ? DarkColors : LightColors;
  const { width } = useWindowDimensions();
  const isMobileWeb = width < 768;

  return (
    <View
      style={[
        styles.webPage,
        isMobileWeb ? styles.webPageMobile : styles.webPageDesktop,
        { backgroundColor: isMobileWeb ? colors.background : colors.separator },
      ]}
    >
      <View
        style={[
          styles.webViewport,
          isMobileWeb ? styles.webViewportMobile : styles.webViewportDesktop,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function ThemeAwareApp() {
  const isDark = useThemeStore((s) => s.isDark);
  const [webIconFontsLoaded, webIconFontsError] = useFonts(
    Platform.OS === 'web' ? MaterialCommunityIcons.font : {}
  );

  if (Platform.OS === 'web' && !webIconFontsLoaded && !webIconFontsError) {
    return null;
  }

  return (
    <PaperProvider theme={isDark ? paperDarkTheme : paperLightTheme}>
      <WebAppFrame isDark={isDark}>
        <RootNavigator />
      </WebAppFrame>
    </PaperProvider>
  );
}

export default function App() {
  return <ThemeAwareApp />;
}

const styles = StyleSheet.create({
  webPage: {
    flex: 1,
  },
  webPageDesktop: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  webPageMobile: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  webViewport: {
    width: '100%',
    flex: 1,
  },
  webViewportDesktop: {
    maxWidth: 430,
    height: '100%',
    maxHeight: '100%',
    minHeight: '100%',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  webViewportMobile: {
    minHeight: '100%',
  },
});
