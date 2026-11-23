// Exam Mode screen: set the exam date and see the study plan.
import React, { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppButton } from '../../src/components/AppButton';
import { DateStepper } from '../../src/components/controls';
import { Badge, BarChart, EmptyState, Panel, Row, SectionTitle, StatTile, textStyles } from '../../src/components/ui';
import { paramToId, showError, useFocusData } from '../../src/hooks/useFocusData';
import { getExamOverview, setExamDate } from '../../src/services/examService';
import { addDays, formatDay, formatShortDay } from '../../src/utils/dates';
import { today } from '../../src/utils/clock';
import { colors, spacing } from '../../src/theme';

const FORECAST_DAYS = 14;

export default function ExamScreen() {
  const subjectId = paramToId(useLocalSearchParams<{ subjectId: string }>().subjectId);
  const { data, reload } = useFocusData(async () => (subjectId === null ? null : getExamOverview(subjectId)), [subjectId]);
  const t = today();
  const [draft, setDraft] = useState(addDays(t, 7));
  const [saving, setSaving] = useState(false);

  // Start the date picker at the saved exam date, if it is still in the future.
  useEffect(() => {
    if (data?.active && data.subject.examDate) setDraft(data.subject.examDate);
  }, [data?.active, data?.subject.examDate]);

  if (!data) return <Screen>{null}</Screen>;
  const { subject, plan, active, totalCards } = data;

  const save = async (date: string | null) => {
    setSaving(true);
    try {
      const result = await setExamDate(subject.id, date);
      await reload();
      if (date !== null) {
        Alert.alert(
          'Exam date saved',
          result.movedCards > 0
            ? `${result.movedCards} card(s) were planned after the exam. They were moved earlier and spread over the days before it.`
            : 'All cards are already planned before the exam.',
        );
      }
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: `${subject.name} · Exam` }} />

      {active && plan ? (
        <>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={textStyles.heading}>{formatDay(plan.examDate)}</Text>
            <Badge text="Exam Mode on" color={colors.exam} background={colors.examSoft} />
          </Row>
          <Row>
            <StatTile value={plan.daysLeft} label="days left" color={colors.exam} />
            <StatTile value={plan.cardsToReview} label="cards to review" />
            <StatTile value={plan.dailyTarget} label="cards / day" color={colors.primary} />
          </Row>
          <Panel style={{ gap: spacing.sm }}>
            <Text style={textStyles.title}>Plan until the exam</Text>
            <Text style={textStyles.muted}>
              Cards due each day until {formatDay(plan.lastReviewDay)}. Overdue cards are counted for today.
            </Text>
            <BarChart
              data={plan.forecast.slice(0, FORECAST_DAYS).map(d => ({ label: formatShortDay(d.date).split(' ')[0], value: d.count }))}
              highlightIndex={0}
            />
          </Panel>
          <Panel style={{ gap: spacing.xs, backgroundColor: colors.examSoft, borderColor: colors.examSoft }}>
            <Text style={textStyles.title}>How Exam Mode works</Text>
            <Text style={textStyles.body}>
              • SM-2 still calculates the interval as usual.{'\n'}• If the next review would be on or after the exam day, it is
              moved to the day before the exam at the latest: interval = min(SM-2, D − 1).{'\n'}• Hard and overdue cards are shown
              first.{'\n'}• EF and the SM-2 history are never changed.
            </Text>
          </Panel>
        </>
      ) : (
        <EmptyState
          title={subject.examDate ? 'This exam has passed' : 'No exam date'}
          message={
            totalCards === 0
              ? 'Add some cards first, then set the exam date.'
              : 'Set the exam date and Recallo will make sure every card is reviewed before it.'
          }
        />
      )}

      <SectionTitle>{active ? 'Change exam date' : 'Set exam date'}</SectionTitle>
      <Panel style={{ gap: spacing.md }}>
        <DateStepper value={draft} onChange={setDraft} min={addDays(t, 1)} />
        <AppButton title="Save exam date" onPress={() => save(draft)} loading={saving} />
        {subject.examDate ? (
          <AppButton title="Remove exam date" variant="ghost" onPress={() => save(null)} disabled={saving} />
        ) : null}
      </Panel>
    </Screen>
  );
}
