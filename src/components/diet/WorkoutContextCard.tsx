import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import { WorkoutDietAdjustment } from '../../lib/workout-diet-sync';
import { useAppTheme } from '../../theme';

interface WorkoutContextCardProps {
  adjustment: WorkoutDietAdjustment;
  hasAIPlanGoal: boolean;
  onDismiss: () => void;
}

function buildHeadline(adj: WorkoutDietAdjustment, hasAIPlanGoal: boolean): string {
  const parts: string[] = [adj.workoutLabel];
  if (hasAIPlanGoal) {
    parts.push(`AI 플랜 목표에 +${adj.additionalCalories} kcal 추가`);
  } else {
    const changedMacros: string[] = [];
    if (adj.additionalCarbs > 0) changedMacros.push(`탄수화물 +${adj.additionalCarbs}g`);
    if (changedMacros.length > 0) parts.push(`${changedMacros.join(', ')} 조정됨`);
  }
  return parts.join(' · ');
}

function buildSubline(adj: WorkoutDietAdjustment, hasAIPlanGoal: boolean): string {
  const items: string[] = [];
  if (adj.additionalProtein > 0) items.push(`단백질 +${adj.additionalProtein}g`);
  if (hasAIPlanGoal && adj.additionalCarbs > 0) items.push(`탄수화물 +${adj.additionalCarbs}g`);
  if (!hasAIPlanGoal && adj.additionalCalories > 0) items.push(`칼로리 +${adj.additionalCalories} kcal`);
  if (items.length === 0) return '';
  return items.join(' · ') + ' 추가';
}

export function WorkoutContextCard({ adjustment, hasAIPlanGoal, onDismiss }: WorkoutContextCardProps) {
  const { colors, typography } = useAppTheme();
  const headline = buildHeadline(adjustment, hasAIPlanGoal);
  const subline = buildSubline(adjustment, hasAIPlanGoal);

  return (
    <View style={[styles.card, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}>
      <View style={styles.row}>
        <MaterialCommunityIcons name="dumbbell" size={20} color={colors.accent} style={styles.icon} />
        <View style={styles.content}>
          <Text style={[styles.headline, { color: colors.text, fontFamily: typography.fontFamily }]}>
            {headline}
          </Text>
          {Boolean(subline) && (
            <Text style={[styles.subline, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
              {subline}
            </Text>
          )}
          <Text style={[styles.caption, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
            운동 볼륨 기반 추정값입니다
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  icon: {
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  headline: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  subline: {
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
