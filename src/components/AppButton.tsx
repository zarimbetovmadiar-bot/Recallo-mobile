// AppButton — one button style for the whole app.
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: ViewStyle;
}

const BACKGROUND: Record<Variant, string> = {
  primary: colors.primary,
  secondary: colors.primarySoft,
  danger: colors.forgotSoft,
  ghost: 'transparent',
};

const TEXT: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.primary,
  danger: colors.forgot,
  ghost: colors.primary,
};

export function AppButton({ title, onPress, variant = 'primary', disabled, loading, small, style }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: BACKGROUND[variant], opacity: inactive ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={TEXT[variant]} />
      ) : (
        <Text style={[styles.text, small && styles.smallText, { color: TEXT[variant] }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { minHeight: 36, paddingHorizontal: spacing.md },
  text: { fontSize: font.body, fontWeight: '600' },
  smallText: { fontSize: font.small },
});
