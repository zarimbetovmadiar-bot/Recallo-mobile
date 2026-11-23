// Review session: show a question, reveal the answer, rate it, see the next review date.
//
// Params: ?deckId=... (one deck), ?subjectId=... (one subject) or nothing (all due cards).
//
// Adaptation A4 (SM-2 step 7): a card rated Forgot or Difficult comes back at the
// end of the session until it is rated Easy. Only the FIRST rating of a card is
// saved to SM-2; repeats inside the session do not change its schedule.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { CardWithContext, Rating, ReviewResult } from '../src/models/types';
import { Screen } from '../src/components/Screen';
import { AppButton } from '../src/components/AppButton';
import { RatingButtons } from '../src/components/controls';
import { Badge, EmptyState, Panel, Row, StatTile, textStyles } from '../src/components/ui';
import { paramToId, showError } from '../src/hooks/useFocusData';
import { getSessionCards, rateCard } from '../src/services/reviewService';
import { isExamActive } from '../src/scheduling/examScheduler';
import { formatDay, relativeDays } from '../src/utils/dates';
import { today } from '../src/utils/clock';
import { colors, font, radius, spacing } from '../src/theme';

interface QueueItem {
  card: CardWithContext;
  /** True when the card comes back in the same session (A4). */
  relearn: boolean;
}

export default function ReviewScreen() {
  const params = useLocalSearchParams<{ deckId?: string; subjectId?: string }>();
  const deckId = paramToId(params.deckId) ?? undefined;
  const subjectId = paramToId(params.subjectId) ?? undefined;

  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastResult, setLastResult] = useState<ReviewResult | null>(null);
  const [counts, setCounts] = useState<Record<Rating, number>>({ forgot: 0, hard: 0, easy: 0 });
  const fade = useRef(new Animated.Value(0)).current;

  // Load the cards ONCE when the session starts (not on every focus).
  useEffect(() => {
    getSessionCards({ deckId, subjectId })
      .then(cards => {
        setQueue(cards.map(card => ({ card, relearn: false })));
        setTotal(cards.length);
      })
      .catch(showError);
  }, [deckId, subjectId]);

  const reveal = () => {
    setRevealed(true);
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };

  // A ref (not state) blocks a fast double tap at once, before the screen re-renders (test T6.4).
  const busy = useRef(false);

  const onRate = async (rating: Rating) => {
    if (!queue || queue.length === 0 || busy.current) return;
    busy.current = true;
    const [current, ...rest] = queue;
    setSaving(true);
    try {
      if (!current.relearn) {
        const result = await rateCard(current.card.id, rating);
        setLastResult(result);
        setCounts(c => ({ ...c, [rating]: c[rating] + 1 }));
      }
      // Not "Easy" yet -> the card comes back at the end of this session (A4).
      const next = rating === 'easy' ? rest : [...rest, { card: current.card, relearn: true }];
      setQueue(next);
      setRevealed(false);
    } catch (e) {
      showError(e);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  if (queue === null) return <Screen>{null}</Screen>;

  // ---------- Session finished ----------
  if (queue.length === 0) {
    return (
      <Screen>
        {total === 0 ? (
          <EmptyState title="Nothing to review" message="There are no cards due right now." />
        ) : (
          <>
            <Text style={textStyles.heading}>Session complete 🎉</Text>
            <Text style={textStyles.muted}>{total} card(s) reviewed. The next dates are saved.</Text>
            <Row>
              <StatTile value={counts.forgot} label="Forgot" color={colors.forgot} />
              <StatTile value={counts.hard} label="Difficult" color={colors.hard} />
              <StatTile value={counts.easy} label="Easy" color={colors.easy} />
            </Row>
            {lastResult ? <ResultBanner result={lastResult} /> : null}
          </>
        )}
        <AppButton title="Done" onPress={() => router.back()} />
      </Screen>
    );
  }

  // ---------- Current card ----------
  const { card, relearn } = queue[0];
  const t = today();
  const examActive = isExamActive(t, card.examDate);
  const done = total - queue.filter(q => !q.relearn).length;

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={textStyles.muted}>
          {Math.min(done + 1, total)} / {total}
          {relearn ? '  ·  once more' : ''}
        </Text>
        {examActive ? (
          <Badge text={`Exam ${formatDay(card.examDate as string)}`} color={colors.exam} background={colors.examSoft} />
        ) : null}
      </Row>

      {lastResult ? <ResultBanner result={lastResult} /> : null}

      <Panel style={styles.card}>
        <Text style={textStyles.muted}>
          {card.subjectName} · {card.deckName}
        </Text>
        <Text style={styles.question}>{card.question}</Text>
        {revealed ? (
          <Animated.View style={[styles.answerBox, { opacity: fade }]}>
            <View style={styles.divider} />
            <Text style={styles.answer}>{card.answer}</Text>
          </Animated.View>
        ) : null}
      </Panel>

      {revealed ? (
        <>
          <Text style={[textStyles.muted, styles.center]}>How well did you remember it?</Text>
          <RatingButtons onRate={onRate} disabled={saving} />
          {relearn ? (
            <Text style={[textStyles.muted, styles.center]}>Practice round: this rating does not change the schedule.</Text>
          ) : null}
        </>
      ) : (
        <AppButton title="Show answer" onPress={reveal} />
      )}
    </Screen>
  );
}

/** Shows what happened to the previous card: SM-2 interval and, if shortened, the Exam Mode interval. */
function ResultBanner({ result }: { result: ReviewResult }) {
  const t = today();
  return (
    <View style={[styles.banner, result.capped && styles.bannerExam]}>
      <Text style={styles.bannerTitle}>
        Previous card: next review {relativeDays(t, result.dueDate)} ({formatDay(result.dueDate)})
      </Text>
      <Text style={textStyles.muted}>
        {result.capped
          ? `SM-2: ${result.sm2IntervalDays} days → Exam Mode: ${result.actualIntervalDays} days (before the exam on ${formatDay(result.examDate as string)})`
          : `SM-2 interval: ${result.sm2IntervalDays} day(s)`}
        {`  ·  EF ${result.easeFactorBefore.toFixed(2)} → ${result.easeFactorAfter.toFixed(2)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 220, gap: spacing.md, justifyContent: 'center' },
  question: { fontSize: font.heading, fontWeight: '700', color: colors.text, textAlign: 'center' },
  answerBox: { gap: spacing.md },
  answer: { fontSize: font.title, color: colors.text, textAlign: 'center' },
  divider: { height: 1, backgroundColor: colors.border },
  center: { textAlign: 'center' },
  banner: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  bannerExam: { backgroundColor: colors.examSoft },
  bannerTitle: { fontWeight: '700', color: colors.text },
});
