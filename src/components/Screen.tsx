// Screen — the background and padding of every screen, with scrolling.
import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, scroll = true, style }: Props) {
  if (!scroll) return <View style={[styles.base, styles.padding, style]}>{children}</View>;
  return (
    <ScrollView
      style={styles.base}
      contentContainerStyle={[styles.padding, style]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, backgroundColor: colors.background },
  padding: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
});
