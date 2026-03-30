import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
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

  return (
    <View style={[styles.webPage, { backgroundColor: colors.separator }]}>
      <View
        style={[
          styles.webViewport,
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
  const [webIconFontsLoaded] = useFonts(
    Platform.OS === 'web' ? MaterialCommunityIcons.font : {}
  );

  if (Platform.OS === 'web' && !webIconFontsLoaded) {
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  webViewport: {
    width: '100%',
    maxWidth: 430,
    height: '100%',
    maxHeight: '100%',
    minHeight: '100%',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
