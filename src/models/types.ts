// types.ts — the shapes of our data (like POJO / record classes in Java).
// Every layer uses these types, so this file is the "contract" of the team.

/** The three answer buttons in a review session. */
export type Rating = 'forgot' | 'hard' | 'easy';

/** A date without time, always written as 'YYYY-MM-DD' in the phone's local time zone. */
export type DateString = string;

export interface Subject {
  id: number;
  name: string;
  color: string;
  /** Exam date ('YYYY-MM-DD') or null when no exam is set. */
  examDate: DateString | null;
  createdAt: string;
}

export interface SubjectWithCounts extends Subject {
  deckCount: number;
  cardCount: number;
  dueCount: number;
}

export interface Deck {
  id: number;
  subjectId: number;
  name: string;
  createdAt: string;
}

export interface DeckWithCounts extends Deck {
  cardCount: number;
  dueCount: number;
}

/** The part of a card that the SM-2 algorithm works with. */
export interface Sm2State {
  /** EF: how easy the card is. Starts at 2.5, never below 1.3. */
  easeFactor: number;
  /** n: how many times in a row the card was remembered. */
  repetitions: number;
  /** I: the interval in days that SM-2 calculated (before Exam Mode). */
  intervalDays: number;
}

export interface Card extends Sm2State {
  id: number;
  deckId: number;
  question: string;
  answer: string;
  /** The real date when the card is shown again (Exam Mode may move it earlier). */
  dueDate: DateString;
  /** The last day the card was reviewed, or null for a new card. */
  lastReviewedDate: DateString | null;
  createdAt: string;
}

/** A card together with information about its deck and subject. */
export interface CardWithContext extends Card {
  deckName: string;
  subjectId: number;
  subjectName: string;
  subjectColor: string;
  examDate: DateString | null;
}

/** One row of the review history: one press of a rating button. */
export interface ReviewLog {
  id: number;
  cardId: number;
  reviewedDate: DateString;
  reviewedAt: string;
  rating: Rating;
  quality: number;
  efBefore: number;
  efAfter: number;
  intervalBefore: number;
  sm2Interval: number;
  actualInterval: number;
  dueDateAfter: DateString;
  examCapped: boolean;
}

/** What the review session screen gets back after a rating. */
export interface ReviewResult {
  cardId: number;
  rating: Rating;
  /** Interval that pure SM-2 wanted. */
  sm2IntervalDays: number;
  /** Interval after Exam Mode (equal to sm2IntervalDays when no exam). */
  actualIntervalDays: number;
  dueDate: DateString;
  /** True when Exam Mode made the interval shorter. */
  capped: boolean;
  examDate: DateString | null;
  easeFactorBefore: number;
  easeFactorAfter: number;
}
