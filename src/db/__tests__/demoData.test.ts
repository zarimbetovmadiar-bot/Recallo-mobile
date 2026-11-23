// Tests that the demo data supports the defense scenario (docs/DEMO.md).
import { buildDemoData, simulateCard } from '../demoData';
import { sortForExam, computeDueDate, pullForwardForExam } from '../../scheduling/examScheduler';
import { sm2Review } from '../../scheduling/sm2';
import { addDays } from '../../utils/dates';

const TODAY = '2026-12-01';
const data = buildDemoData(TODAY);
const calculus = data[0];
const integrals = calculus.decks[0];
const discrete = data[1];

describe('demo data', () => {
  test('prepared cards are due today with n = 2, I = 6, EF = 2.70', () => {
    for (const card of [integrals.cards[0], integrals.cards[1], discrete.decks[0].cards[0]]) {
      expect(card.dueDate).toBe(TODAY);
      expect(card.state).toEqual({ easeFactor: 2.7, repetitions: 2, intervalDays: 6 });
    }
  });

  test('demo step: Easy gives 16 days in SM-2 and 6 days with an exam in 7 days', () => {
    const next = sm2Review(integrals.cards[0].state, 5, 6);
    expect(next.intervalDays).toBe(16);
    expect(computeDueDate(TODAY, next.intervalDays, addDays(TODAY, 7))).toEqual({
      dueDate: addDays(TODAY, 6),
      actualIntervalDays: 6,
      capped: true,
    });
  });

  test('in Integrals only the two prepared cards are due today, and the first one is shown first', () => {
    const withIds = integrals.cards.map((c, i) => ({ id: i + 1, dueDate: c.dueDate, easeFactor: c.state.easeFactor, repetitions: c.state.repetitions }));
    const due = withIds.filter(c => c.dueDate <= TODAY);
    expect(due.map(c => c.id)).toEqual([1, 2]);
    expect(sortForExam(due)[0].id).toBe(1);
  });

  test('setting the exam never moves a Calculus card to today', () => {
    const all = calculus.decks.flatMap(d => d.cards).map((c, i) => ({ id: i + 1, dueDate: c.dueDate, easeFactor: c.state.easeFactor, repetitions: c.state.repetitions }));
    const changes = pullForwardForExam(all, TODAY, addDays(TODAY, 7));
    expect(changes.length).toBeGreaterThanOrEqual(1);
    for (const ch of changes) expect(ch.dueDate > TODAY).toBe(true);
  });

  test('every simulated card is consistent: last log matches the card state', () => {
    for (const subject of data)
      for (const deck of subject.decks)
        for (const card of deck.cards) {
          if (card.logs.length === 0) {
            expect(card.lastReviewedDate).toBeNull();
            continue;
          }
          const last = card.logs[card.logs.length - 1];
          expect(last.efAfter).toBe(card.state.easeFactor);
          expect(last.dueDateAfter).toBe(card.dueDate);
          expect(card.dueDate >= TODAY).toBe(true);
        }
  });

  test('a new card has no history and is due today', () => {
    const c = simulateCard({ question: 'q', answer: 'a' }, TODAY);
    expect(c.logs).toHaveLength(0);
    expect(c.dueDate).toBe(TODAY);
  });
});
