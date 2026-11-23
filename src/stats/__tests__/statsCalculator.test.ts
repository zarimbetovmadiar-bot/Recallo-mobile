// Tests for statistics (plan section "Testing", T7).
import { activityByDay, currentStreak, progressBreakdown } from '../statsCalculator';

describe('progress', () => {
  test('T7.1 no cards -> zeros, never NaN', () => {
    const p = progressBreakdown([]);
    expect(p).toEqual({ total: 0, newCount: 0, learningCount: 0, matureCount: 0, startedPercent: 0, maturePercent: 0 });
  });

  test('T7.4 interval 20 = learning, 21 = mature, never reviewed = new', () => {
    const p = progressBreakdown([
      { intervalDays: 20, lastReviewedDate: '2026-11-01' },
      { intervalDays: 21, lastReviewedDate: '2026-11-01' },
      { intervalDays: 0, lastReviewedDate: null },
      { intervalDays: 1, lastReviewedDate: '2026-11-10' },
    ]);
    expect(p.newCount).toBe(1);
    expect(p.learningCount).toBe(2);
    expect(p.matureCount).toBe(1);
    expect(p.startedPercent).toBe(75);
    expect(p.maturePercent).toBe(25);
  });
});

describe('activity', () => {
  test('T7.5 always 14 bars, missing days are 0, today is last', () => {
    const a = activityByDay([{ date: '2026-11-14', count: 5 }, { date: '2026-11-10', count: 2 }], '2026-11-14');
    expect(a).toHaveLength(14);
    expect(a[0].date).toBe('2026-11-01');
    expect(a[13]).toEqual({ date: '2026-11-14', count: 5 });
    expect(a[9]).toEqual({ date: '2026-11-10', count: 2 });
    expect(a.filter(d => d.count === 0)).toHaveLength(12);
  });
});

describe('streak', () => {
  const TODAY = '2026-11-14';
  test('T7.3 reviews on 12, 13, 14 Nov -> 3', () => {
    expect(currentStreak(['2026-11-12', '2026-11-13', '2026-11-14'], TODAY)).toBe(3);
  });
  test('T7.3 nothing today yet, 12 and 13 Nov -> 2 (not lost until the day ends)', () => {
    expect(currentStreak(['2026-11-12', '2026-11-13'], TODAY)).toBe(2);
  });
  test('T7.3 last review 2 days ago -> 0', () => {
    expect(currentStreak(['2026-11-10', '2026-11-12'], TODAY)).toBe(0);
  });
  test('no reviews -> 0', () => {
    expect(currentStreak([], TODAY)).toBe(0);
  });
});
