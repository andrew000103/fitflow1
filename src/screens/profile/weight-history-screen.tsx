import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { addBodyWeight, getBodyWeights } from '../../lib/profile';
import { useAuthStore } from '../../stores/auth-store';
import { useAppTheme } from '../../theme';
import { BodyWeightRecord } from '../../types/profile';
import { Field, Section } from '../../components/profile/profile-components';

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WeightHistoryScreen() {
  const { colors, typography } = useAppTheme();
  const { user } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weights, setWeights] = useState<BodyWeightRecord[]>([]);

  const [weightKg, setWeightKg] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [muscleMassKg, setMuscleMassKg] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async (showSpinner = false) => {
    if (!user?.id) return;
    if (showSpinner) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getBodyWeights(user.id, 50);
      setWeights(data);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddWeight = async () => {
    if (!user?.id) return;
    const parsedWeight = parseOptionalNumber(weightKg);
    if (!parsedWeight || parsedWeight <= 0) {
      Alert.alert('입력 필요', '체중을 올바르게 입력하세요.');
      return;
    }

    setSaving(true);
    try {
      await addBodyWeight(user.id, {
        weight_kg: parsedWeight,
        body_fat_pct: parseOptionalNumber(bodyFatPct),
        muscle_mass_kg: parseOptionalNumber(muscleMassKg),
        notes: notes.trim() || undefined,
      });
      setWeightKg('');
      setBodyFatPct('');
      setMuscleMassKg('');
      setNotes('');
      loadData(true);
      Alert.alert('성공', '기록이 추가되었습니다.');
    } catch (error) {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
    >
      <Section title="새 기록 추가">
        <Field label="체중(kg)" value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" placeholder="72.4" />
        <View style={styles.row}>
          <View style={styles.half}>
            <Field label="체지방률(%)" value={bodyFatPct} onChangeText={setBodyFatPct} keyboardType="decimal-pad" placeholder="18.2" />
          </View>
          <View style={styles.half}>
            <Field label="골격근량(kg)" value={muscleMassKg} onChangeText={setMuscleMassKg} keyboardType="decimal-pad" placeholder="33.5" />
          </View>
        </View>
        <Field label="메모" value={notes} onChangeText={setNotes} placeholder="컨디션 등" multiline />
        <Button mode="contained" onPress={handleAddWeight} loading={saving}>추가하기</Button>
      </Section>

      <Section title="이전 기록">
        {weights.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily }}>기록이 없습니다.</Text>
        ) : (
          weights.map((entry) => (
            <View key={entry.id} style={[styles.weightRow, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={{ color: colors.text, fontFamily: typography.fontFamily, fontSize: 16, fontWeight: '600' }}>
                  {entry.weight_kg}kg
                </Text>
                <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: 12 }}>
                  {formatDate(entry.measured_at)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {entry.body_fat_pct && <Text style={{ color: colors.textSecondary, fontSize: 12 }}>체지방 {entry.body_fat_pct}%</Text>}
                {entry.muscle_mass_kg && <Text style={{ color: colors.textSecondary, fontSize: 12 }}>근육량 {entry.muscle_mass_kg}kg</Text>}
              </View>
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 16 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
