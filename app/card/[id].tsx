// Card screen: question, answer, SM-2 state and the full review history.
// Very useful on the defense to show HOW the algorithm changed EF and intervals.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppButton } from '../../src/components/AppButton';
import { Badge, EmptyState, Panel, Row, SectionTitle, StatTile, textStyles } from '../../src/components/ui';
import { paramToId, useFocusData } from '../../src/hooks/useFocusData';
import { getCard } from '../../src/services/contentService';
import { getCardHistory } from '../../src/services/reviewService';
import { labelOf } from '../../src/scheduling/ratings';
import { formatDay, relativeDays } from '../../src/utils/dates';
import { today } from '../../src/utils/clock';
import { colors, spacing } from '../../src/theme';

export default function CardScreen() {
  const id = paramToId(useLocalSearchParams<{ id: string }>().id);
  const { data } = useFocusData(async () => {
    if (id === null) return null;
    const [card, history] = await Promise.all([getCard(id), getCardHistory(id)]);
    return card ? { card, history } : null;
  }, [id]);

  if (!data) return <Screen>{null}</Screen>;
  const { card, history } = data;
  const t = today();

  return (
    <Screen>
      <Stack.Screen options={{ title: card.deckName }} />

      <Panel style={{ gap: spacing.sm }}>
        <Text style={textStyles.muted}>Question</Text>
        <Text style={textStyles.title}>{card.question}</Text>
        <View style={styles.divider} />
        <Text style={textStyles.muted}>Answer</Text>
        <Text style={textStyles.body}>{card.answer}</Text>
      </Panel>

      <SectionTitle>SM-2 state</SectionTitle>
      <Row>
        <StatTile value={card.easeFactor.toFixed(2)} label="EF (ease)" />
        <StatTile value={card.repetitions} label="n (in a row)" />
        <StatTile value={`${card.intervalDays} d`} label="I (SM-2)" />
      </Row>
      <Panel>
        <Text style={textStyles.body}>
          Next review: {formatDay(card.dueDate)} ({card.dueDate <= t ? 'due now' : relativeDays(t, card.dueDate)})
        </Text>
      </Panel>

      <AppButton
        title="Edit card"
        variant="secondary"
        onPress={() => router.push({ pathname: '/card/edit', params: { id: String(card.id) } })}
      />

      <SectionTitle>{`History (${history.length})`}</SectionTitle>
      {history.length === 0 ? <EmptyState title="Not reviewed yet" message="This is a new card." /> : null}
      {history.map(log => (
        <Panel key={log.id} style={{ gap: spacing.xs }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={textStyles.body}>{formatDay(log.reviewedDate)}</Text>
            <Text style={[styles.rating, { color: log.rating === 'forgot' ? colors.forgot : log.rating === 'hard' ? colors.hard : colors.easy }]}>
              {labelOf(log.rating)} (q = {log.quality})
            </Text>
          </Row>
          <Text style={textStyles.muted}>
            EF {log.efBefore.toFixed(2)} → {log.efAfter.toFixed(2)} · interval {log.intervalBefore} → {log.sm2Interval} d
            {log.examCapped ? ` → ${log.actualInterval} d` : ''}
          </Text>
          {log.examCapped ? <Badge text="Shortened by Exam Mode" color={colors.exam} background={colors.examSoft} /> : null}
        </Panel>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  rating: { fontWeight: '700' },
});
