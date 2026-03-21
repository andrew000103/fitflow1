import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import { NutritionSummary } from '../../types/nutrition';

interface Props {
  nutrition: NutritionSummary;
}

function MacroRow({
  label,
  color,
  current_g,
  goal_g,
}: {
  label: string;
  color: string;
  current_g: number;
  goal_g: number;
}) {
  const { colors, typography } = useAppTheme();
  const progress = Math.min(current_g / Math.max(goal_g, 1), 1);

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.label, { color: colors.text, fontFamily: typography.fontFamily, fontSize: typography.size.sm }]}>
          {label}
        </Text>
        <Text style={[styles.value, { color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: typography.size.sm }]}>
          {current_g}g <Text style={{ color: colors.textTertiary }}>/ {goal_g}g</Text>
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.trackBg }]}>
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

export default function MacroBars({ nutrition }: Props) {
  const { colors, typography } = useAppTheme();

  const macros = [
    { key: 'protein' as const, label: '단백질', color: colors.protein },
    { key: 'carbs' as const, label: '탄수화물', color: colors.carbs },
    { key: 'fat' as const, label: '지방', color: colors.fat },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.semibold }]}>
        영양소
      </Text>
      {macros.map(({ key, label, color }) => (
        <MacroRow
          key={key}
          label={label}
          color={color}
          current_g={nutrition[key].current_g}
          goal_g={nutrition[key].goal_g}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
  },
  title: {
    marginBottom: 16,
  },
  row: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    flex: 1,
  },
  value: {},
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
