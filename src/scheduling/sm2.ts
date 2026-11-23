// sm2.ts — the SuperMemo SM-2 algorithm (P. Wozniak).
//
// A pure function: it gets the old state and a grade, and returns a NEW state.
// It does not know about the database, the screen or exams.
// See docs/SM2.md for the full explanation and our documented adaptations.

import type { Sm2State } from '../models/types';

export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;

/** State of a card that was never reviewed. */
export const NEW_CARD_STATE: Sm2State = { easeFactor: INITIAL_EASE, repetitions: 0, intervalDays: 0 };

/**
 * New ease factor after a grade q:
 *   EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),  and never below 1.3.
 * Changes per grade: q=5 +0.10, q=4 0, q=3 -0.14, q=2 -0.32, q=1 -0.54, q=0 -0.80.
 * All changes are multiples of 0.01, so rounding to 2 decimals only removes
 * floating point noise like 2.6000000000000005.
 */
export function nextEaseFactor(easeFactor: number, quality: number): number {
  const d = 5 - quality;
  const raw = easeFactor + (0.1 - d * (0.08 + d * 0.02));
  return Math.max(MIN_EASE, Math.round(raw * 100) / 100);
}

/**
 * One SM-2 review.
 *
 * @param state     the card's current EF, n and I
 * @param quality   grade q from 0 to 5 (our buttons give 1, 3 or 5)
 * @param previousIntervalDays  the interval the card "survived". Normally this is
 *        state.intervalDays. The review service passes a smaller number if the card
 *        was shown earlier than planned (adaptation A3).
 */
export function sm2Review(state: Sm2State, quality: number, previousIntervalDays: number = state.intervalDays): Sm2State {
  if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
    throw new RangeError(`Quality must be an integer from 0 to 5, got ${quality}`);
  }

  let repetitions: number;
  let intervalDays: number;

  if (quality >= 3) {
    // Remembered: the interval grows.
    if (state.repetitions === 0) {
      intervalDays = 1;
    } else if (state.repetitions === 1) {
      intervalDays = 6;
    } else {
      // Uses the OLD ease factor, as in the original SM-2.
      intervalDays = Math.max(1, Math.round(previousIntervalDays * state.easeFactor));
    }
    repetitions = state.repetitions + 1;
  } else {
    // Forgotten: start learning the card again.
    repetitions = 0;
    intervalDays = 1;
  }

  // Adaptation A2: EF is updated after EVERY grade, also after a failed one.
  const easeFactor = nextEaseFactor(state.easeFactor, quality);

  return { easeFactor, repetitions, intervalDays };
}
