// ratings.ts — how the three buttons map to SM-2 "quality" q (0..5).
//
// Original SM-2 has six grades (0..5). We use three buttons (adaptation A1):
//   Forgot    -> q = 1  (q < 3: the card is learned again from the start)
//   Difficult -> q = 3  (lowest "remembered" grade: EF goes down by 0.14)
//   Easy      -> q = 5  (best grade: EF goes up by 0.10)

import type { Rating } from '../models/types';

export interface RatingOption {
  rating: Rating;
  quality: number;
  label: string;
}

export const RATING_OPTIONS: readonly RatingOption[] = [
  { rating: 'forgot', quality: 1, label: 'Forgot' },
  { rating: 'hard', quality: 3, label: 'Difficult' },
  { rating: 'easy', quality: 5, label: 'Easy' },
];

export function qualityOf(rating: Rating): number {
  const option = RATING_OPTIONS.find(o => o.rating === rating);
  if (!option) throw new RangeError(`Unknown rating: ${rating}`);
  return option.quality;
}

export function labelOf(rating: Rating): string {
  const option = RATING_OPTIONS.find(o => o.rating === rating);
  return option ? option.label : rating;
}
