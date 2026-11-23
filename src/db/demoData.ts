// demoData.ts — realistic demo content for the defense.
//
// The review history is NOT typed in by hand: for every card we "replay" its
// reviews through the real SM-2 code, starting some days in the past.
// So every number you see in the demo (EF, intervals, history, statistics)
// is exactly what the app itself would have produced.
//
// This file is pure (no database), so it is covered by unit tests.

import type { DateString, Rating, Sm2State } from '../models/types';
import { NEW_CARD_STATE, sm2Review } from '../scheduling/sm2';
import { qualityOf } from '../scheduling/ratings';
import { addDays, daysBetween } from '../utils/dates';

export interface DemoCardSpec {
  question: string;
  answer: string;
  /** First review, in days relative to today (e.g. -20). Omit for a new card. */
  start?: number;
  /** Ratings used one after another, repeated if needed. */
  pattern?: Rating[];
  /** Exact list of reviews (day offset + rating) instead of start/pattern. */
  reviews?: { day: number; rating: Rating }[];
}

export interface DemoDeckSpec {
  name: string;
  cards: DemoCardSpec[];
}

export interface DemoSubjectSpec {
  name: string;
  color: string;
  decks: DemoDeckSpec[];
}

export interface DemoLog {
  reviewedDate: DateString;
  rating: Rating;
  quality: number;
  efBefore: number;
  efAfter: number;
  intervalBefore: number;
  sm2Interval: number;
  actualInterval: number;
  dueDateAfter: DateString;
}

export interface DemoCard {
  question: string;
  answer: string;
  state: Sm2State;
  dueDate: DateString;
  lastReviewedDate: DateString | null;
  logs: DemoLog[];
}

export interface DemoDeck {
  name: string;
  cards: DemoCard[];
}

export interface DemoSubject {
  name: string;
  color: string;
  decks: DemoDeck[];
}

/** Replays one card's reviews through SM-2 (no exam is set in the demo data). */
export function simulateCard(spec: DemoCardSpec, today: DateString): DemoCard {
  let state: Sm2State = NEW_CARD_STATE;
  let lastReviewedDate: DateString | null = null;
  let dueDate: DateString = today;
  const logs: DemoLog[] = [];

  const review = (day: DateString, rating: Rating) => {
    const quality = qualityOf(rating);
    // Same rule as reviewService.previousIntervalFor (adaptation A3).
    const previous =
      lastReviewedDate === null ? state.intervalDays : Math.max(1, Math.min(state.intervalDays, daysBetween(lastReviewedDate, day)));
    const next = sm2Review(state, quality, previous);
    const due = addDays(day, next.intervalDays);
    logs.push({
      reviewedDate: day,
      rating,
      quality,
      efBefore: state.easeFactor,
      efAfter: next.easeFactor,
      intervalBefore: state.intervalDays,
      sm2Interval: next.intervalDays,
      actualInterval: next.intervalDays,
      dueDateAfter: due,
    });
    state = next;
    lastReviewedDate = day;
    dueDate = due;
  };

  if (spec.reviews) {
    for (const r of spec.reviews) review(addDays(today, r.day), r.rating);
  } else if (spec.start !== undefined && spec.pattern && spec.pattern.length > 0) {
    // Review the card every time it becomes due, until it is due today or later.
    let day = addDays(today, spec.start);
    let k = 0;
    while (day < today) {
      review(day, spec.pattern[k % spec.pattern.length]);
      k++;
      day = dueDate;
    }
  }

  return { question: spec.question, answer: spec.answer, state, dueDate, lastReviewedDate, logs };
}

export function buildDemoData(today: DateString, specs: DemoSubjectSpec[] = DEMO_SPECS): DemoSubject[] {
  return specs.map(s => ({
    name: s.name,
    color: s.color,
    decks: s.decks.map(d => ({ name: d.name, cards: d.cards.map(c => simulateCard(c, today)) })),
  }));
}

// ---------------------------------------------------------------------------
// The demo content.
// "Prepared" cards (reviewed Easy 7 and 6 days ago) are due today with
// n = 2, I = 6, EF = 2.70. After Easy, SM-2 gives round(6 x 2.70) = 16 days.
// With an exam in 7 days, Exam Mode caps this to 6 days. See docs/DEMO.md.
// ---------------------------------------------------------------------------
const PREPARED: { day: number; rating: Rating }[] = [
  { day: -7, rating: 'easy' },
  { day: -6, rating: 'easy' },
];

export const DEMO_SPECS: DemoSubjectSpec[] = [
  {
    name: 'Calculus',
    color: '#4F46E5',
    decks: [
      {
        name: 'Integrals',
        cards: [
          { question: '∫ xⁿ dx  (n ≠ −1) = ?', answer: 'xⁿ⁺¹ / (n + 1) + C', reviews: PREPARED },
          { question: '∫ 1/x dx = ?', answer: 'ln|x| + C', reviews: PREPARED },
          { question: '∫ eˣ dx = ?', answer: 'eˣ + C', start: -13, pattern: ['easy', 'easy', 'easy'] },
          { question: '∫ cos x dx = ?', answer: 'sin x + C', start: -12, pattern: ['easy', 'hard', 'easy'] },
          { question: '∫ sin x dx = ?', answer: '−cos x + C', start: -11, pattern: ['hard', 'forgot', 'easy', 'easy'] },
          { question: '∫ sec² x dx = ?', answer: 'tan x + C', start: -10, pattern: ['easy', 'easy', 'hard'] },
          { question: 'u-substitution: ∫ f(g(x))·g′(x) dx = ?', answer: '∫ f(u) du, where u = g(x)', start: -9, pattern: ['hard', 'easy', 'easy'] },
          { question: 'Integration by parts', answer: '∫ u dv = uv − ∫ v du', start: -12, pattern: ['forgot', 'hard', 'easy', 'easy'] },
          { question: 'Area between y = f(x) and y = g(x) on [a, b]', answer: '∫ₐᵇ |f(x) − g(x)| dx', start: -8, pattern: ['easy', 'easy'] },
          { question: 'Volume by disks around the x-axis', answer: 'V = π ∫ₐᵇ [f(x)]² dx', start: -11, pattern: ['hard', 'hard', 'easy'] },
          { question: 'Fundamental Theorem of Calculus (part 2)', answer: '∫ₐᵇ f(x) dx = F(b) − F(a), where F′ = f', start: -8, pattern: ['easy', 'forgot', 'easy', 'easy'] },
          { question: '∫ aˣ dx = ?', answer: 'aˣ / ln a + C', start: -10, pattern: ['easy', 'easy', 'easy'] },
        ],
      },
      {
        name: 'Derivatives',
        cards: [
          { question: 'd/dx (xⁿ) = ?', answer: 'n·xⁿ⁻¹', start: -45, pattern: ['easy'] },
          { question: 'Product rule', answer: '(f·g)′ = f′·g + f·g′', start: -44, pattern: ['easy', 'easy', 'hard', 'easy'] },
          { question: 'Quotient rule', answer: '(f/g)′ = (f′·g − f·g′) / g²', start: -40, pattern: ['hard', 'easy', 'easy', 'easy'] },
          { question: 'Chain rule', answer: '(f(g(x)))′ = f′(g(x))·g′(x)', start: -42, pattern: ['easy', 'easy', 'easy'] },
          { question: 'd/dx (ln x) = ?', answer: '1/x', start: -14, pattern: ['easy', 'hard'] },
          { question: 'd/dx (sin x) = ?', answer: 'cos x', start: -13, pattern: ['easy', 'easy'] },
        ],
      },
    ],
  },
  {
    name: 'Discrete Math',
    color: '#10B981',
    decks: [
      {
        name: 'Sets & Relations',
        cards: [
          { question: '|A ∪ B| = ?', answer: '|A| + |B| − |A ∩ B|', reviews: PREPARED },
          { question: 'When is a relation R on A reflexive?', answer: '(a, a) ∈ R for every a ∈ A', start: -12, pattern: ['easy', 'hard', 'easy'] },
          { question: 'When is a relation symmetric?', answer: 'If (a, b) ∈ R then (b, a) ∈ R', start: -11, pattern: ['hard', 'easy', 'easy'] },
          { question: 'When is a relation transitive?', answer: 'If (a, b) ∈ R and (b, c) ∈ R then (a, c) ∈ R', start: -10, pattern: ['forgot', 'easy', 'easy'] },
          { question: 'How many subsets does a set with n elements have?', answer: '2ⁿ', start: -9, pattern: ['easy', 'easy', 'easy'] },
          { question: 'What is A \\ B?', answer: 'All elements of A that are not in B', start: -8, pattern: ['easy', 'hard'] },
          { question: 'Equivalence relation', answer: 'A relation that is reflexive, symmetric and transitive', start: -13, pattern: ['hard', 'forgot', 'easy', 'easy'] },
        ],
      },
    ],
  },
  {
    name: 'Programming (Java)',
    color: '#F59E0B',
    decks: [
      {
        name: 'OOP basics',
        cards: [
          { question: 'What is encapsulation?', answer: 'Hiding fields (private) and giving access through methods' },
          { question: 'Interface vs abstract class', answer: 'Interface: only a contract, a class can implement many. Abstract class: can have state and code, only one parent.' },
          { question: 'What does `static` mean?', answer: 'The member belongs to the class, not to an object' },
          { question: 'Overloading vs overriding', answer: 'Overloading: same name, different parameters (one class). Overriding: a subclass replaces a parent method.' },
          { question: 'What is a constructor?', answer: 'A special method that creates and initializes an object; same name as the class, no return type' },
        ],
      },
    ],
  },
];
