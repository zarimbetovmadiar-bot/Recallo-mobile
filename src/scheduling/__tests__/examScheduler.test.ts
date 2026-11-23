// Tests for Exam Mode (plan section "Testing", T4).
// Today = 2026-12-01, exam = 2026-12-11, so D = 10 and the cap is 9 days.
import {
  computeDueDate,
  intervalCap,
  isExamActive,
  planForExam,
  pullForwardForExam,
  sortForExam,
  SchedulableCard,
} from '../examScheduler';

const TODAY = '2026-12-01';
const EXAM = '2026-12-11';

function card(id: number, dueDate: string, easeFactor = 2.5, repetitions = 3): SchedulableCard {
  return { id, dueDate, easeFactor, repetitions };
}

describe('Exam Mode: is it active?', () => {
  test('active when the exam is 1 or more days away', () => {
    expect(isExamActive(TODAY, EXAM)).toBe(true);
    expect(isExamActive('2026-12-10', EXAM)).toBe(true);
  });
  test('not active on the exam day, after it, or without an exam', () => {
    expect(isExamActive('2026-12-11', EXAM)).toBe(false);
    expect(isExamActive('2026-12-20', EXAM)).toBe(false);
    expect(isExamActive(TODAY, null)).toBe(false);
  });
  test('cap = max(1, D - 1)', () => {
    expect(intervalCap(TODAY, EXAM)).toBe(9);
    expect(intervalCap('2026-12-08', EXAM)).toBe(2);
    expect(intervalCap('2026-12-10', EXAM)).toBe(1);
    expect(intervalCap(TODAY, null)).toBeNull();
  });
});

describe('Rule 1: interval cap', () => {
  test('T4.1 SM-2 wants 16 days -> capped to 9, shown on 2026-12-10', () => {
    expect(computeDueDate(TODAY, 16, EXAM)).toEqual({ dueDate: '2026-12-10', actualIntervalDays: 9, capped: true });
  });
  test('T4.2 SM-2 wants 6 days -> below the cap, unchanged', () => {
    expect(computeDueDate(TODAY, 6, EXAM)).toEqual({ dueDate: '2026-12-07', actualIntervalDays: 6, capped: false });
  });
  test('same grade on 2026-12-08 (D = 3) -> cap 2 -> 2026-12-10', () => {
    expect(computeDueDate('2026-12-08', 16, EXAM).dueDate).toBe('2026-12-10');
  });
  test('T4.3 the day before the exam (D = 1) -> shown on the exam morning', () => {
    expect(computeDueDate('2026-12-10', 16, EXAM)).toEqual({ dueDate: '2026-12-11', actualIntervalDays: 1, capped: true });
  });
  test('T4.4 on the exam day Exam Mode is off -> normal 16 days', () => {
    expect(computeDueDate('2026-12-11', 16, EXAM)).toEqual({ dueDate: '2026-12-27', actualIntervalDays: 16, capped: false });
  });
  test('T4.5 no exam -> normal SM-2 interval', () => {
    expect(computeDueDate(TODAY, 16, null)).toEqual({ dueDate: '2026-12-17', actualIntervalDays: 16, capped: false });
  });
  test('Forgot (1 day) is never changed', () => {
    expect(computeDueDate(TODAY, 1, EXAM).dueDate).toBe('2026-12-02');
  });
});

describe('Rule 2: moving cards earlier when an exam is set', () => {
  test('T4.7 simple version: a card due 12-20 moves to the exam eve, a card due 12-05 stays', () => {
    const changes = pullForwardForExam([card(1, '2026-12-20'), card(2, '2026-12-05')], TODAY, EXAM, false);
    expect(changes).toEqual([{ id: 1, dueDate: '2026-12-10' }]);
  });

  test('spread version: moved cards land between tomorrow and the exam eve, hardest first', () => {
    const cards = [card(1, '2026-12-30', 2.5), card(2, '2026-12-25', 1.5), card(3, '2027-01-10', 2.0)];
    const changes = pullForwardForExam(cards, TODAY, EXAM, true);
    expect(changes.map(c => c.id)).toEqual([2, 3, 1]); // lowest EF first
    for (const c of changes) {
      expect(c.dueDate >= '2026-12-02').toBe(true);
      expect(c.dueDate <= '2026-12-10').toBe(true);
    }
    expect(changes[0].dueDate).toBe('2026-12-02');
  });

  test('spread version never puts more than ceil(cards / days) on one day', () => {
    const cards = Array.from({ length: 27 }, (_, i) => card(i + 1, '2027-02-01', 2.5));
    const changes = pullForwardForExam(cards, TODAY, EXAM, true);
    const perDay = new Map<string, number>();
    for (const c of changes) perDay.set(c.dueDate, (perDay.get(c.dueDate) ?? 0) + 1);
    expect(Math.max(...perDay.values())).toBeLessThanOrEqual(3); // 27 cards / 9 days
  });

  test('exam tomorrow: late cards go to today', () => {
    const changes = pullForwardForExam([card(1, '2026-12-20')], '2026-12-10', EXAM, true);
    expect(changes).toEqual([{ id: 1, dueDate: '2026-12-10' }]);
  });

  test('no exam or a past exam -> nothing moves', () => {
    expect(pullForwardForExam([card(1, '2026-12-20')], TODAY, null)).toEqual([]);
    expect(pullForwardForExam([card(1, '2026-12-20')], '2026-12-12', EXAM)).toEqual([]);
  });
});

describe('Rule 3: priority in a session', () => {
  test('T4.9 more overdue first, then lower EF', () => {
    const a = card(1, '2026-11-28', 2.5); // overdue 3 days
    const b = card(2, '2026-11-30', 1.3); // overdue 1 day, hard
    const c = card(3, '2026-11-30', 2.0); // overdue 1 day
    expect(sortForExam([c, b, a]).map(x => x.id)).toEqual([1, 2, 3]);
  });
  test('same date and EF -> fewer repetitions first, then id', () => {
    const x = card(5, TODAY, 2.5, 4);
    const y = card(6, TODAY, 2.5, 1);
    const z = card(4, TODAY, 2.5, 1);
    expect(sortForExam([x, y, z]).map(k => k.id)).toEqual([4, 6, 5]);
  });
});

describe('Rule 4: daily plan', () => {
  test('T4.8 45 cards due before the exam, 10 days left -> 5 cards per day', () => {
    const cards = Array.from({ length: 45 }, (_, i) => card(i + 1, '2026-12-05'));
    const plan = planForExam(cards, TODAY, EXAM);
    expect(plan).not.toBeNull();
    expect(plan!.daysLeft).toBe(10);
    expect(plan!.cardsToReview).toBe(45);
    expect(plan!.dailyTarget).toBe(5);
    expect(plan!.lastReviewDay).toBe('2026-12-10');
  });

  test('forecast covers today..exam eve, overdue cards count for today', () => {
    const cards = [card(1, '2026-11-25'), card(2, TODAY), card(3, '2026-12-03'), card(4, '2026-12-30')];
    const plan = planForExam(cards, TODAY, EXAM)!;
    expect(plan.forecast).toHaveLength(10);
    expect(plan.forecast[0]).toEqual({ date: TODAY, count: 2 });
    expect(plan.forecast[2]).toEqual({ date: '2026-12-03', count: 1 });
    expect(plan.cardsToReview).toBe(3); // the 12-30 card is not counted until it is moved
  });

  test('no plan without an active exam; empty deck gives target 0', () => {
    expect(planForExam([], TODAY, null)).toBeNull();
    expect(planForExam([], TODAY, EXAM)!.dailyTarget).toBe(0);
  });
});
