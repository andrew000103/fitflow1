import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import { WorkoutSummary } from '../../types/workout';

interface Props {
  workout: WorkoutSummary | null;
}

export default function WorkoutStatusCard({ workout }: Props) {
  const { colors, typography } = useAppTheme();
  const completed = workout?.completed ?? false;

  const iconBg = completed ? colors.successMuted : colors.accentMuted;
  const iconColor = completed ? colors.success : colors.accent;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons
          name={completed ? 'check-circle' : 'dumbbell'}
          size={24}
          color={iconColor}
        />
      </View>

      <View style={styles.text}>
        <Text
          style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.semibold }]}
        >
          {completed ? '오늘 운동 완료!' : '오늘 운동을 시작해보세요'}
        </Text>
        <Text
          style={[styles.sub, { color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: typography.size.sm }]}
        >
          {completed && workout
            ? `${workout.set_count}세트 · 총 볼륨 ${workout.total_volume_kg.toLocaleString()}kg`
            : '운동 탭에서 세션을 시작하세요'}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.textTertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  text: {
    flex: 1,
  },
  title: {
    lineHeight: 20,
  },
  sub: {
    marginTop: 3,
  },
});
