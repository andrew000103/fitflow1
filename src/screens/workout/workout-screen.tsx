import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorkoutScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <MaterialCommunityIcons name="dumbbell" size={48} color="#CCC" />
        <Text variant="titleMedium" style={styles.title}>운동</Text>
        <Text variant="bodyMedium" style={styles.sub}>Phase 1 — 다음 작업 예정</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { fontWeight: 'bold', color: '#333' },
  sub: { color: '#999' },
});
