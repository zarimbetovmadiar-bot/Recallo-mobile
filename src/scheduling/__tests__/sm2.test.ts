// Tests for SM-2 (plan section "Testing", T3). Run: npm test
import { sm2Review, nextEaseFactor, NEW_CARD_STATE, MIN_EASE } from '../sm2';
import { qualityOf } from '../ratings';

describe('SM-2: the life of one card (worked example from docs/SM2.md)', () => {
  test('T3.1 new card, Easy -> I = 1, n = 1, EF = 2.60', () => {
    const s = sm2Review(NEW_CARD_STATE, 5);
    expect(s.intervalDays).toBe(1);
    expect(s.repetitions).toBe(1);
    expect(s.easeFactor).toBeCloseTo(2.6);
  });

  test('T3.2 second success, Easy -> I = 6, n = 2, EF = 2.70', () => {
    const s = sm2Review({ easeFactor: 2.6, repetitions: 1, intervalDays: 1 }, 5);
    expect(s.intervalDays).toBe(6);
    expect(s.repetitions).toBe(2);
    expect(s.easeFactor).toBeCloseTo(2.7);
  });

  test('T3.3 third success, Difficult -> I = round(6 x 2.70) = 16, n = 3, EF = 2.56', () => {
    const s = sm2Review({ easeFactor: 2.7, repetitions: 2, intervalDays: 6 }, 3);
    expect(s.intervalDays).toBe(16);
    expect(s.repetitions).toBe(3);
    expect(s.easeFactor).toBeCloseTo(2.56);
  });

  test('T3.4 Forgot -> I = 1, n = 0, EF = 2.02', () => {
    const s = sm2Review({ easeFactor: 2.56, repetitions: 3, intervalDays: 16 }, 1);
    expect(s.intervalDays).toBe(1);
    expect(s.repetitions).toBe(0);
    expect(s.easeFactor).toBeCloseTo(2.02);
  });

  test('after Forgot the card starts again: Easy -> I = 1, EF = 2.12', () => {
    const s = sm2Review({ easeFactor: 2.02, repetitions: 0, intervalDays: 1 }, 5);
    expect(s.intervalDays).toBe(1);
    expect(s.repetitions).toBe(1);
    expect(s.easeFactor).toBeCloseTo(2.12);
  });
});

describe('SM-2: ease factor', () => {
  test('EF change for every grade q = 0..5', () => {
    expect(nextEaseFactor(2.5, 5)).toBeCloseTo(2.6);
    expect(nextEaseFactor(2.5, 4)).toBeCloseTo(2.5);
    expect(nextEaseFactor(2.5, 3)).toBeCloseTo(2.36);
    expect(nextEaseFactor(2.5, 2)).toBeCloseTo(2.18);
    expect(nextEaseFactor(2.5, 1)).toBeCloseTo(1.96);
    expect(nextEaseFactor(2.5, 0)).toBeCloseTo(1.7);
  });

  test('T3.5 EF never goes below 1.3 (EF 1.4, Forgot)', () => {
    expect(sm2Review({ easeFactor: 1.4, repetitions: 4, intervalDays: 10 }, 1).easeFactor).toBe(MIN_EASE);
  });

  test('T3.6 EF stays 1.3 after Difficult', () => {
    expect(sm2Review({ easeFactor: 1.3, repetitions: 4, intervalDays: 10 }, 3).easeFactor).toBe(MIN_EASE);
  });

  test('EF has no floating point noise (2.5 + 0.1 is exactly 2.6)', () => {
    expect(sm2Review(NEW_CARD_STATE, 5).easeFactor).toBe(2.6);
  });
});

describe('SM-2: intervals', () => {
  test('third success uses the OLD EF: I = round(6 x 2.5) = 15', () => {
    expect(sm2Review({ easeFactor: 2.5, repetitions: 2, intervalDays: 6 }, 5).intervalDays).toBe(15);
  });

  test('T3.7 (A3) card shown early: only 3 days passed, so I = round(3 x 2.5) = 8', () => {
    const s = sm2Review({ easeFactor: 2.5, repetitions: 3, intervalDays: 16 }, 5, 3);
    expect(s.intervalDays).toBe(8);
    expect(s.repetitions).toBe(4);
    expect(s.easeFactor).toBeCloseTo(2.6);
  });

  test('interval is at least 1 day even with a tiny previous interval', () => {
    expect(sm2Review({ easeFactor: 1.3, repetitions: 5, intervalDays: 0 }, 3, 0).intervalDays).toBe(1);
  });

  test('T3.9 20 x Easy in a row: all intervals are finite whole numbers and grow', () => {
    let s = NEW_CARD_STATE;
    let last = 0;
    for (let i = 0; i < 20; i++) {
      s = sm2Review(s, 5);
      expect(Number.isInteger(s.intervalDays)).toBe(true);
      expect(Number.isFinite(s.intervalDays)).toBe(true);
      expect(s.intervalDays).toBeGreaterThanOrEqual(last);
      last = s.intervalDays;
    }
  });
});

describe('SM-2: safety', () => {
  test('T3.8 the input object is not changed', () => {
    const before = { easeFactor: 2.5, repetitions: 2, intervalDays: 6 };
    const copy = { ...before };
    sm2Review(before, 1);
    expect(before).toEqual(copy);
  });

  test('wrong quality is rejected', () => {
    expect(() => sm2Review(NEW_CARD_STATE, 6)).toThrow();
    expect(() => sm2Review(NEW_CARD_STATE, -1)).toThrow();
    expect(() => sm2Review(NEW_CARD_STATE, 2.5)).toThrow();
  });

  test('buttons map to q = 1 / 3 / 5', () => {
    expect(qualityOf('forgot')).toBe(1);
    expect(qualityOf('hard')).toBe(3);
    expect(qualityOf('easy')).toBe(5);
  });
});
