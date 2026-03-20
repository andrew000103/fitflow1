import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuthStore } from '../stores/auth-store';
import AuthNavigator from './auth-navigator';

// TODO Phase 1: 홈/운동/식단/프로필 탭 네비게이터로 교체
function MainPlaceholder() {
  const { signOut } = useAuthStore();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text variant="headlineSmall">로그인 성공! 🎉</Text>
      <Text variant="bodyMedium" style={{ color: '#666' }}>메인 화면은 다음 단계에서 구현됩니다.</Text>
      <Button mode="outlined" onPress={signOut}>로그아웃</Button>
    </View>
  );
}

export default function RootNavigator() {
  const { user, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainPlaceholder /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
