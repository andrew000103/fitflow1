import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';

import { AppCard } from '../common/AppCard';
import { useAppTheme } from '../../theme';

interface ProteinRemainingCardProps {
  currentProtein?: number;
  goalProtein?: number;
  currentProteinG?: number;
  goalProteinG?: number;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function ProteinRemainingCard({
  currentProtein,
  goalProtein,
  currentProteinG,
  goalProteinG,
  title = '오늘 남은 단백질',
  subtitle = '목표 대비 얼마나 더 챙겨야 하는지 보여드려요',
  onPress,
  style,
}: ProteinRemainingCardProps) {
  const current = currentProteinG ?? currentProtein ?? 0;
  const goal = goalProteinG ?? goalProtein ?? 0;
  const { colors, typography, radius } = useAppTheme();
  const remainingProtein = Math.max(Math.round((goal - current) * 10) / 10, 0);
  const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
  const progressWidth = `${Math.max(progress * 100, 6)}%` as `${number}%`;
  const isComplete = remainingProtein <= 0;

  const card = (
    <AppCard variant="elevated" style={[styles.card, { borderRadius: radius.xl }, style]}>
      <View style={[styles.iconWrap, { backgroundColor: isComplete ? colors.successMuted : colors.accentMuted }]}>
        <MaterialCommunityIcons
          name={isComplete ? 'check-circle-outline' : 'food-steak'}
          size={24}
          color={isComplete ? colors.success : colors.accent}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
          {title}
        </Text>
        <Text style={[styles.value, { color: colors.text, fontFamily: typography.fontFamily }]}>
          {isComplete ? '목표 달성' : `${remainingProtein}g 남았어요`}
        </Text>
        <Text style={[styles.caption, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
          {Math.round(current)}g 섭취 / 목표 {goal}g
        </Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
          {subtitle}
        </Text>
        <View style={[styles.track, { backgroundColor: colors.separator }]}>
          <View
            style={[
              styles.fill,
              {
                backgroundColor: isComplete ? colors.success : colors.protein,
                width: progressWidth,
              },
            ]}
          />
        </View>
      </View>
    </AppCard>
  );

  if (!onPress) {
    return card;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }, styles.pressableWrap]}>
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressableWrap: {
    width: '100%',
  },
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginHorizontal: 16,
    padding: 16,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  content: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  caption: {
    fontSize: 12,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  track: {
    borderRadius: 999,
    height: 8,
    marginTop: 12,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 999,
    height: '100%',
  },
});
