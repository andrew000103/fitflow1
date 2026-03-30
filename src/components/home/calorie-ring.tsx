import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '../../theme';

interface Props {
  current: number;
  goal: number;
  size?: number;
}

const STROKE_WIDTH = 16;
const isWeb = Platform.OS === 'web';

export default function CalorieRing({ current, goal, size = 196 }: Props) {
  const { colors, typography } = useAppTheme();

  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / Math.max(goal, 1), 1);
  const strokeDashoffset = circumference * (1 - progress);
  const isOver = current > goal;
  const remaining = Math.max(goal - current, 0);
  const strokeColor = isOver ? colors.error : colors.accent;

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.trackBg}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={isWeb ? undefined : `${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center text */}
      <View style={[styles.center, { width: size, height: size }]}>
        <Text
          style={[
            styles.current,
            { color: colors.text, fontFamily: typography.fontFamily, fontSize: typography.size.xxxl, fontWeight: typography.weight.bold },
          ]}
        >
          {current.toLocaleString()}
        </Text>
        <Text style={[styles.unit, { color: colors.textSecondary, fontSize: typography.size.sm }]}>
          kcal 섭취
        </Text>
        <Text
          style={[
            styles.remaining,
            { color: isOver ? colors.error : colors.textSecondary, fontSize: typography.size.xs, marginTop: 4 },
          ]}
        >
          {isOver ? `${(current - goal).toLocaleString()} 초과` : `${remaining.toLocaleString()} 남음`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  current: {
    lineHeight: 38,
  },
  unit: {
    marginTop: 4,
  },
  remaining: {},
});
