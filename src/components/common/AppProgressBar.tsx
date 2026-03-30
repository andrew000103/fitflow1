import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme';

interface AppProgressBarProps {
  progress: number; // 0 to 1
  color: string;
  height?: number;
  trackColor?: string;
  style?: ViewStyle;
}

export function AppProgressBar({
  progress,
  color,
  height = 8,
  trackColor,
  style,
}: AppProgressBarProps) {
  const { colors, radius } = useAppTheme();

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor || colors.trackBg,
          borderRadius: radius.full,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
            backgroundColor: color,
            borderRadius: radius.full,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
