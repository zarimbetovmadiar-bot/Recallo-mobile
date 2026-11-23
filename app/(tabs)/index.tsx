// Today screen: what to review today, upcoming exams, streak.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppButton } from '../../src/components/AppButton';
import { Badge, EmptyState, ListItem, Panel, Row, SectionTitle, StatTile, textStyles } from '../../src/components/ui';
import { useFocusData } from '../../src/hooks/useFocusData';
import { getTodaySummary } from '../../src/services/statsService';
import { getUpcomingExams } from '../../src/services/examService';
import { listSubjects } from '../../src/services/contentService';
import { formatDay } from '../../src/utils/dates';
import { getDemoOffset } from '../../src/utils/clock';
import { colors, spacing } from '../../src/theme';

async function loadToday() {
  const [summary, exams, subjects] = await Promise.all([getTodaySummary(), getUpcomingExams(), listSubjects()]);
  return { summary, exams, hasCards: subjects.some(s => s.cardCount > 0) };
}

export default function TodayScreen() {
  const { data } = useFocusData(loadToday);
  if (!data) return <Screen>{null}</Screen>;
  const { summary, exams, hasCards } = data;
  const offset = getDemoOffset();

  return (
    <Screen>
      <Text style={textStyles.muted}>
        {formatDay(summary.today)}
        {offset !== 0 ? `  ·  demo clock ${offset > 0 ? '+' : ''}${offset} d` : ''}
      </Text>

      <Row>
        <StatTile value={summary.dueTotal} label="cards due" color={colors.primary} />
        <StatTile value={summary.reviewedToday} label="reviewed today" />
        <StatTile value={summary.streak} label="day streak" />
      </Row>

      {exams.length > 0 ? (
        <>
          <SectionTitle>Upcoming exams</SectionTitle>
          {exams.map(({ subject, daysLeft }) => (
            <ListItem
              key={subject.id}
              color={subject.color}
              title={subject.name}
              subtitle={`Exam on ${formatDay(subject.examDate as string)}`}
              right={daysLeft === 1 ? 'tomorrow' : `${daysLeft} days`}
              onPress={() => router.push({ pathname: '/exam/[subjectId]', params: { subjectId: String(subject.id) } })}
            />
          ))}
        </>
      ) : null}

      <SectionTitle>Due today</SectionTitle>
      {summary.dueTotal > 0 ? (
        <>
          <AppButton title={`Review all (${summary.dueTotal})`} onPress={() => router.push('/review')} />
          {summary.dueDecks.map(d => (
            <ListItem
              key={d.deckId}
              color={d.subjectColor}
              title={d.deckName}
              subtitle={d.subjectName}
              right={`${d.dueCount} due`}
              onPress={() => router.push({ pathname: '/review', params: { deckId: String(d.deckId) } })}
            />
          ))}
          {summary.dueDecks.some(d => exams.some(e => e.subject.id === d.subjectId)) ? (
            <View style={styles.note}>
              <Badge text="Exam Mode" color={colors.exam} background={colors.examSoft} />
              <Text style={textStyles.muted}>Cards of subjects with an exam come first.</Text>
            </View>
          ) : null}
        </>
      ) : hasCards ? (
        <EmptyState title="All done for today 🎉" message="Come back tomorrow. Spaced repetition works best a little every day." />
      ) : (
        <EmptyState title="No cards yet" message="Create a subject, a deck and some cards — or load the demo data in Settings.">
          <AppButton title="Create a subject" variant="secondary" onPress={() => router.push('/subjects')} />
        </EmptyState>
      )}

      <Panel style={styles.tip}>
        <Text style={textStyles.muted}>
          Recallo shows each card again just before you would forget it (SM-2 algorithm). Set an exam date to make sure
          every card is reviewed before the exam.
        </Text>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tip: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
});
