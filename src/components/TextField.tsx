// TextField — a labelled text input.
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}

export function TextField({ label, value, onChangeText, placeholder, multiline, maxLength, autoFocus, onSubmitEditing }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={multiline ? 'default' : 'done'}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontSize: font.small, color: colors.textMuted, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: font.body,
    color: colors.text,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
});
