import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth-store';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <MaterialCommunityIcons name="account-circle" size={64} color="#CCC" />
        <Text variant="titleMedium" style={styles.email}>
          {user?.email ?? '게스트'}
        </Text>
        <Text variant="bodyMedium" style={styles.sub}>Phase 1 — 다음 작업 예정</Text>
        <Button mode="outlined" onPress={signOut} style={styles.signOut}>
          로그아웃
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  email: { fontWeight: 'bold', color: '#333' },
  sub: { color: '#999' },
  signOut: { marginTop: 8 },
});
