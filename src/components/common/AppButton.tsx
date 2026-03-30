import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';

interface AppButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'error';
  label: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export function AppButton({
  variant = 'primary',
  label,
  size = 'md',
  icon,
  loading = false,
  style,
  ...props
}: AppButtonProps) {
  const { colors, radius, spacing, typography } = useAppTheme();

  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          button: { backgroundColor: colors.accent },
          text: { color: '#FFFFFF' },
        };
      case 'secondary':
        return {
          button: { backgroundColor: colors.accentMuted },
          text: { color: colors.accent },
        };
      case 'error':
        return {
          button: { backgroundColor: colors.errorMuted },
          text: { color: colors.error },
        };
      case 'ghost':
        return {
          button: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
          text: { color: colors.textSecondary },
        };
      default:
        return { button: {}, text: {} };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md };
      case 'md':
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.lg };
      case 'lg':
        return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl };
      default:
        return {};
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { borderRadius: radius.md },
        getSizeStyles(),
        vStyles.button,
        style,
      ]}
      activeOpacity={0.8}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#FFFFFF' : undefined} />
      ) : icon}
      <Text
        style={[
          styles.text,
          {
            fontFamily: typography.fontFamily,
            fontWeight: typography.weight.semibold,
            fontSize: size === 'sm' ? typography.size.sm : typography.size.md,
          },
          vStyles.text,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    textAlign: 'center',
  },
});
