// controls.tsx — inputs specific to Recallo: rating buttons, color picker, date stepper.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DateString, Rating } from '../models/types';
import { RATING_OPTIONS } from '../scheduling/ratings';
import { addDays, formatDay } from '../utils/dates';
import { colors, font, radius, spacing } from '../theme';

const RATING_COLORS: Record<Rating, { text: string; background: string }> = {
  forgot: { text: colors.forgot, background: colors.forgotSoft },
  hard: { text: colors.hard, background: colors.hardSoft },
  easy: { text: colors.easy, background: colors.easySoft },
};

/** The three answer buttons: Forgot / Difficult / Easy. */
export function RatingButtons({ onRate, disabled }: { onRate: (rating: Rating) => void; disabled?: boolean }) {
  return (
    <View style={styles.ratingRow}>
      {RATING_OPTIONS.map(option => (
        <Pressable
          key={option.rating}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => onRate(option.rating)}
          style={({ pressed }) => [
            styles.ratingButton,
            { backgroundColor: RATING_COLORS[option.rating].background, opacity: disabled ? 0.5 : pressed ? 0.75 : 1 },
          ]}
        >
          <Text style={[styles.ratingText, { color: RATING_COLORS[option.rating].text }]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** A row of color circles. */
export function ColorPicker({ palette, value, onChange }: { palette: readonly string[]; value: string; onChange: (c: string) => void }) {
  return (
    <View style={styles.colorRow}>
      {palette.map(c => (
        <Pressable
          key={c}
          accessibilityLabel={`Color ${c}`}
          onPress={() => onChange(c)}
          style={[styles.colorDot, { backgroundColor: c }, c === value && styles.colorSelected]}
        />
      ))}
    </View>
  );
}

/**
 * Choose a date with buttons instead of a calendar (no extra library needed).
 * `min` is the earliest allowed date.
 */
export function DateStepper({ value, onChange, min }: { value: DateString; onChange: (d: DateString) => void; min: DateString }) {
  const set = (d: DateString) => onChange(d < min ? min : d);
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperDate}>{formatDay(value)}</Text>
      <View style={styles.stepperRow}>
        <StepButton label="−1 day" onPress={() => set(addDays(value, -1))} disabled={value <= min} />
        <StepButton label="+1 day" onPress={() => set(addDays(value, 1))} />
        <StepButton label="+1 week" onPress={() => set(addDays(value, 7))} />
      </View>
    </View>
  );
}

function StepButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.step, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}
    >
      <Text style={styles.stepText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ratingRow: { flexDirection: 'row', gap: spacing.sm },
  ratingButton: { flex: 1, minHeight: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  ratingText: { fontSize: font.body, fontWeight: '700' },
  colorRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: colors.text },
  stepper: { gap: spacing.sm, alignItems: 'center' },
  stepperDate: { fontSize: font.heading, fontWeight: '700', color: colors.text },
  stepperRow: { flexDirection: 'row', gap: spacing.sm },
  step: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  stepText: { color: colors.primary, fontWeight: '600', fontSize: font.small },
});
