import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme';

interface AppCardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outline';
  children: React.ReactNode;
}

export function AppCard({ variant = 'default', children, style, ...props }: AppCardProps) {
  const { colors, radius } = useAppTheme();

  const baseStyle: ViewStyle = {
    backgroundColor: variant === 'elevated' ? colors.cardElevated : colors.card,
    borderRadius: radius.xl,
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: colors.border,
  };

  const shadowStyle: ViewStyle = variant === 'elevated' ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  } : {};

  return (
    <View style={[baseStyle, shadowStyle, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({});
