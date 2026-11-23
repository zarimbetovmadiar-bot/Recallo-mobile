// Statistics screen.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { BarChart, Panel, ProgressBar, Row, SectionTitle, StatTile, textStyles } from '../../src/components/ui';
import { useFocusData } from '../../src/hooks/useFocusData';
import { getDashboard } from '../../src/services/statsService';
import { MATURE_INTERVAL_DAYS } from '../../src/stats/statsCalculator';
import { formatShortDay } from '../../src/utils/dates';
import { colors, spacing } from '../../src/theme';

export default function StatsScreen() {
  const { data } = useFocusData(getDashboard);
  if (!data) return <Screen>{null}</Screen>;
  const { progress, activity } = data;
  const weekTotal = activity.slice(-7).reduce((s, d) => s + d.count, 0);

  return (
    <Screen>
      <Row>
        <StatTile value={data.totalCards} label="cards in total" />
        <StatTile value={data.dueToday} label="due today" color={colors.primary} />
      </Row>
      <Row>
        <StatTile value={data.reviewedToday} label="reviewed today" />
        <StatTile value={data.streak} label={`day streak${data.streak >= 3 ? ' 🔥' : ''}`} />
      </Row>

      <SectionTitle>Learning progress</SectionTitle>
      <Panel style={{ gap: spacing.md }}>
        <Text style={textStyles.title}>
          {progress.startedPercent}% started · {progress.maturePercent}% learned
        </Text>
        <ProgressBar
          parts={[
            { value: progress.matureCount, color: colors.mature },
            { value: progress.learningCount, color: colors.learning },
            { value: progress.newCount, color: colors.newCard },
          ]}
        />
        <Legend color={colors.mature} label={`Learned: ${progress.matureCount} (interval ≥ ${MATURE_INTERVAL_DAYS} days)`} />
        <Legend color={colors.learning} label={`Learning: ${progress.learningCount}`} />
        <Legend color={colors.newCard} label={`New: ${progress.newCount}`} />
      </Panel>

      <SectionTitle>Activity, last 14 days</SectionTitle>
      <Panel style={{ gap: spacing.sm }}>
        <Text style={textStyles.muted}>
          {weekTotal} rating(s) in the last 7 days · {data.totalReviews} in total
        </Text>
        <BarChart
          data={activity.map(d => ({ label: formatShortDay(d.date).split(' ')[0], value: d.count }))}
          highlightIndex={activity.length - 1}
        />
      </Panel>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={textStyles.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  swatch: { width: 12, height: 12, borderRadius: 3 },
});
