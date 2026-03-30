import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getLatestUserGoal, saveUserGoal } from '../../lib/profile';
import { useAuthStore } from '../../stores/auth-store';
import { useAppTheme } from '../../theme';
import { GOAL_TYPE_LABEL, GoalType } from '../../types/profile';
import { Field, SelectorRow } from '../../components/profile/profile-components';

const GOAL_OPTIONS: GoalType[] = ['loss', 'maintain', 'gain'];

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function GoalSettingsScreen() {
  const { colors, typography } = useAppTheme();
  const { user } = useAuthStore();
  const [goalId, setGoalId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [caloriesTarget, setCaloriesTarget] = useState('');
  const [proteinTarget, setProteinTarget] = useState('');
  const [carbsTarget, setCarbsTarget] = useState('');
  const [fatTarget, setFatTarget] = useState('');

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const goal = await getLatestUserGoal(user.id);
      if (goal) {
        setGoalId(goal.id);
        setGoalType(goal.goal_type);
        setCaloriesTarget(goal.calories_target ? String(goal.calories_target) : '');
        setProteinTarget(goal.protein_target_g ? String(goal.protein_target_g) : '');
        setCarbsTarget(goal.carbs_target_g ? String(goal.carbs_target_g) : '');
        setFatTarget(goal.fat_target_g ? String(goal.fat_target_g) : '');
      }
    } catch (error) {
      console.error(error);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await saveUserGoal(
        user.id,
        {
          goal_type: goalType ?? undefined,
          calories_target: parseOptionalNumber(caloriesTarget),
          protein_target_g: parseOptionalNumber(proteinTarget),
          carbs_target_g: parseOptionalNumber(carbsTarget),
          fat_target_g: parseOptionalNumber(fatTarget),
        },
        goalId
      );
      Alert.alert('성공', '목표가 저장되었습니다.');
    } catch (error) {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.label, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>목표 유형</Text>
      <SelectorRow options={GOAL_OPTIONS} selected={goalType} labels={GOAL_TYPE_LABEL} onSelect={setGoalType} />

      <Field label="하루 목표 칼로리" value={caloriesTarget} onChangeText={setCaloriesTarget} keyboardType="numeric" placeholder="2200" />

      <View style={styles.row}>
        <View style={styles.third}>
          <Field label="탄수화물(g)" value={carbsTarget} onChangeText={setCarbsTarget} keyboardType="numeric" placeholder="250" />
        </View>
        <View style={styles.third}>
          <Field label="단백질(g)" value={proteinTarget} onChangeText={setProteinTarget} keyboardType="numeric" placeholder="150" />
        </View>
        <View style={styles.third}>
          <Field label="지방(g)" value={fatTarget} onChangeText={setFatTarget} keyboardType="numeric" placeholder="60" />
        </View>
      </View>

      <Button mode="contained" onPress={handleSave} loading={saving} style={styles.button}>
        저장하기
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  third: {
    flex: 1,
  },
  button: {
    marginTop: 16,
  },
});
