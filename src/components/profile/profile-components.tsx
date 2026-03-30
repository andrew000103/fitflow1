import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';

export function SelectorRow<T extends string>({
  options,
  selected,
  labels,
  onSelect,
}: {
  options: T[];
  selected: T | null;
  labels: Record<T, string>;
  onSelect: (value: T) => void;
}) {
  const { colors, typography } = useAppTheme();

  return (
    <View style={styles.selectorRow}>
      {options.map((option) => {
        const active = selected === option;
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.selectorChip,
              {
                backgroundColor: active ? colors.accentMuted : colors.background,
                borderColor: active ? colors.accent : colors.border,
              },
            ]}
            onPress={() => onSelect(option)}
            activeOpacity={0.8}
          >
            <Text
              style={{
                color: active ? colors.accent : colors.textSecondary,
                fontFamily: typography.fontFamily,
                fontWeight: active ? typography.weight.semibold : typography.weight.regular,
              }}
            >
              {labels[option]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  editable,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'email-address';
  multiline?: boolean;
  editable?: boolean;
}) {
  const { colors, typography } = useAppTheme();

  return (
    <View style={styles.fieldWrap}>
      <Text
        style={{
          color: colors.textSecondary,
          fontFamily: typography.fontFamily,
          fontSize: typography.size.sm,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.background,
            fontFamily: typography.fontFamily,
            height: multiline ? 96 : 46,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
      />
    </View>
  );
}

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { colors, typography } = useAppTheme();

  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text
        style={{
          color: colors.text,
          fontFamily: typography.fontFamily,
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: typography.fontFamily,
            fontSize: typography.size.sm,
            marginTop: 4,
            marginBottom: 12,
          }}
        >
          {subtitle}
        </Text>
      ) : (
        <View style={{ height: 12 }} />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  selectorChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  section: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
});
