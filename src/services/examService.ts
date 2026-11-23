// examService.ts — setting an exam date and building the study plan.

import type { DateString, Subject } from '../models/types';
import * as subjects from '../repositories/subjectRepository';
import * as cards from '../repositories/cardRepository';
import { inTransaction } from '../db/database';
import { ExamPlan, isExamActive, planForExam, pullForwardForExam } from '../scheduling/examScheduler';
import { daysBetween, isValidDateString } from '../utils/dates';
import { today } from '../utils/clock';
import { ValidationError } from './contentService';

export interface SetExamResult {
  /** How many cards were moved earlier (Rule 2). */
  movedCards: number;
}

/**
 * Sets (or clears with null) the exam date of a subject.
 * When an exam is set, cards due after the exam's eve are moved earlier and
 * spread over the remaining days (Rule 2). Cards are never moved later.
 */
export async function setExamDate(subjectId: number, examDate: DateString | null): Promise<SetExamResult> {
  const t = today();
  if (examDate !== null) {
    if (!isValidDateString(examDate)) throw new ValidationError('Please choose a valid date');
    if (daysBetween(t, examDate) < 1) throw new ValidationError('The exam must be at least tomorrow');
  }

  const subjectCards = examDate === null ? [] : await cards.getBySubject(subjectId);
  const changes = pullForwardForExam(subjectCards, t, examDate, true);

  await inTransaction(async () => {
    await subjects.setExamDate(subjectId, examDate);
    for (const change of changes) await cards.setDueDate(change.id, change.dueDate);
  });
  return { movedCards: changes.length };
}

export interface ExamOverview {
  subject: Subject;
  active: boolean;
  plan: ExamPlan | null;
  totalCards: number;
}

export async function getExamOverview(subjectId: number): Promise<ExamOverview | null> {
  const subject = await subjects.getById(subjectId);
  if (!subject) return null;
  const t = today();
  const subjectCards = await cards.getBySubject(subjectId);
  return {
    subject,
    active: isExamActive(t, subject.examDate),
    plan: planForExam(subjectCards, t, subject.examDate),
    totalCards: subjectCards.length,
  };
}

/** Subjects with an upcoming exam and the number of days left (for the Today screen). */
export async function getUpcomingExams(): Promise<{ subject: Subject; daysLeft: number }[]> {
  const t = today();
  const list = await subjects.getWithExam();
  return list
    .filter(s => isExamActive(t, s.examDate))
    .map(s => ({ subject: s, daysLeft: daysBetween(t, s.examDate as DateString) }));
}
