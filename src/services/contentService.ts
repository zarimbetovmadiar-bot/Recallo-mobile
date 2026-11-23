// contentService.ts — creating, editing and deleting subjects, decks and cards.
// Screens call these functions; they check the input and then call repositories.

import * as subjects from '../repositories/subjectRepository';
import * as decks from '../repositories/deckRepository';
import * as cards from '../repositories/cardRepository';
import { today } from '../utils/clock';

/** Thrown when the user's input is not valid. The screen shows `message`. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const SUBJECT_COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899'] as const;

const MAX_NAME = 60;
const MAX_CARD_TEXT = 1000;

function cleanName(value: string, what: string): string {
  const name = value.trim();
  if (!name) throw new ValidationError(`${what} name cannot be empty`);
  if (name.length > MAX_NAME) throw new ValidationError(`${what} name is too long (max ${MAX_NAME})`);
  return name;
}

function cleanCardText(value: string, what: string): string {
  const text = value.trim();
  if (!text) throw new ValidationError(`${what} cannot be empty`);
  if (text.length > MAX_CARD_TEXT) throw new ValidationError(`${what} is too long (max ${MAX_CARD_TEXT})`);
  return text;
}

// ---------- Subjects ----------
export function listSubjects() {
  return subjects.getAllWithCounts(today());
}
export function getSubject(id: number) {
  return subjects.getById(id);
}
export function createSubject(name: string, color: string = SUBJECT_COLORS[0]) {
  return subjects.create(cleanName(name, 'Subject'), color);
}
export function updateSubject(id: number, name: string, color: string) {
  return subjects.update(id, cleanName(name, 'Subject'), color);
}
export function deleteSubject(id: number) {
  return subjects.remove(id);
}

// ---------- Decks ----------
export function listDecks(subjectId: number) {
  return decks.getBySubject(subjectId, today());
}
export function getDeck(id: number) {
  return decks.getById(id);
}
export function createDeck(subjectId: number, name: string) {
  return decks.create(subjectId, cleanName(name, 'Deck'));
}
export function renameDeck(id: number, name: string) {
  return decks.rename(id, cleanName(name, 'Deck'));
}
export function deleteDeck(id: number) {
  return decks.remove(id);
}

// ---------- Cards ----------
export function listCards(deckId: number) {
  return cards.getByDeck(deckId);
}
export function getCard(id: number) {
  return cards.getWithContext(id);
}
export function createCard(deckId: number, question: string, answer: string) {
  return cards.create(deckId, cleanCardText(question, 'Question'), cleanCardText(answer, 'Answer'), today());
}
export function updateCard(id: number, question: string, answer: string) {
  return cards.updateText(id, cleanCardText(question, 'Question'), cleanCardText(answer, 'Answer'));
}
export function deleteCard(id: number) {
  return cards.remove(id);
}
