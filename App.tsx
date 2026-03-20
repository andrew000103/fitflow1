import React from 'react';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/root-navigator';

export default function App() {
  return (
    <PaperProvider>
      <RootNavigator />
    </PaperProvider>
  );
}
