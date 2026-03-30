import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
}

export function AppHeader({ title, subtitle, rightAction }: AppHeaderProps) {
  const { colors, typography, spacing } = useAppTheme();

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
      <View style={styles.titleArea}>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
            {subtitle}
          </Text>
        )}
        <Text style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily }]}>
          {title}
        </Text>
      </View>
      {rightAction && (
        <TouchableOpacity onPress={rightAction.onPress} style={styles.actionBtn}>
          {rightAction.icon}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  titleArea: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionBtn: {
    padding: 4,
  },
});
