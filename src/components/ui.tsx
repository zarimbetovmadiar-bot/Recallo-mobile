// ui.tsx — small reusable building blocks used by many screens.
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

/** A white rounded box. */
export function Panel({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

/** A tappable row: color dot, title, subtitle and a value on the right. */
export function ListItem({
  title,
  subtitle,
  right,
  color,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: string;
  color?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.panel, styles.row, pressed && styles.pressed]}
    >
      {color ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.muted} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <Text style={styles.rowRight}>{right}</Text> : null}
    </Pressable>
  );
}

export function EmptyState({ title, message, children }: { title: string; message?: string; children?: React.ReactNode }) {
  return (
    <Panel style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={[styles.muted, styles.center]}>{message}</Text> : null}
      {children}
    </Panel>
  );
}

/** A big number with a caption, e.g. "12 / due today". */
export function StatTile({ value, label, color = colors.text }: { value: string | number; label: string; color?: string }) {
  return (
    <Panel style={styles.tile}>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </Panel>
  );
}

/** A small colored label. */
export function Badge({ text, color, background }: { text: string; color: string; background: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

/** Horizontal bar split into colored parts (e.g. new / learning / learned cards). */
export function ProgressBar({ parts }: { parts: { value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <View style={styles.bar}>
      {total === 0 ? null : parts.map((p, i) => <View key={i} style={{ flex: p.value, backgroundColor: p.color }} />)}
    </View>
  );
}

/** Simple bar chart made of plain Views: bar height = value / max value. */
export function BarChart({
  data,
  highlightIndex,
  height = 120,
}: {
  data: { label: string; value: number }[];
  highlightIndex?: number;
  height?: number;
}) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <View>
      <View style={[styles.chart, { height }]}>
        {data.map((d, i) => (
          <View key={i} style={styles.chartColumn}>
            {d.value > 0 ? <Text style={styles.chartValue}>{d.value}</Text> : null}
            <View
              style={[
                styles.chartBar,
                {
                  height: `${Math.round((d.value / max) * 80)}%`,
                  backgroundColor: i === highlightIndex ? colors.primary : '#A5B4FC',
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.chartLabels}>
        {data.map((d, i) => (
          <Text key={i} style={styles.chartLabel} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.flexRow, style]}>{children}</View>;
}

export const textStyles = StyleSheet.create({
  muted: { color: colors.textMuted, fontSize: font.small },
  body: { color: colors.text, fontSize: font.body },
  title: { color: colors.text, fontSize: font.title, fontWeight: '700' },
  heading: { color: colors.text, fontSize: font.heading, fontWeight: '700' },
});

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  pressed: { opacity: 0.7 },
  sectionTitle: {
    marginTop: spacing.sm,
    fontSize: font.small,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: 12, height: 12, borderRadius: 6 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
  rowRight: { fontSize: font.small, color: colors.textMuted, fontWeight: '600' },
  muted: { color: colors.textMuted, fontSize: font.small },
  center: { textAlign: 'center' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyTitle: { fontSize: font.title, fontWeight: '700', color: colors.text },
  tile: { flex: 1, gap: 2 },
  tileValue: { fontSize: font.big, fontWeight: '800' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  badgeText: { fontSize: font.small, fontWeight: '700' },
  bar: {
    height: 12,
    borderRadius: radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: colors.border,
  },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  chartColumn: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  chartBar: { width: '100%', borderRadius: 4, minHeight: 2 },
  chartValue: { fontSize: 10, color: colors.textMuted, marginBottom: 2 },
  chartLabels: { flexDirection: 'row', gap: 4, marginTop: 4 },
  chartLabel: { flex: 1, fontSize: 9, color: colors.textMuted, textAlign: 'center' },
  flexRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
});
