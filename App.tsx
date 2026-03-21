import React from 'react';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/root-navigator';
import { useThemeStore } from './src/stores/theme-store';
import { paperDarkTheme, paperLightTheme } from './src/theme';

function ThemeAwareApp() {
  const isDark = useThemeStore((s) => s.isDark);
  return (
    <PaperProvider theme={isDark ? paperDarkTheme : paperLightTheme}>
      <RootNavigator />
    </PaperProvider>
  );
}

export default function App() {
  return <ThemeAwareApp />;
}
