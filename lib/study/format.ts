import { formatEditorialIndex } from "@/lib/documents/format";
import type { GradeVerdict, SessionTopicResult } from "@/lib/study/types";

const SMALL_COUNTS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function formatSessionProgress(index: number, total: number): string {
  return `${formatEditorialIndex(index)} of ${total}`;
}

export function formatSourceDisclosure(
  documentTitle: string,
  pages: readonly number[],
): string {
  const title = documentTitle.trim().toUpperCase();
  const page = pages.length === 0 ? null : Math.min(...pages);
  if (title === "") {
    return page === null ? "SOURCE PAGE UNAVAILABLE" : `PAGE ${page}`;
  }
  if (page === null) {
    return title;
  }
  return `${title} · PAGE ${page}`;
}

export function formatNextReview(dueAt: Date | null, now: Date): string {
  if (dueAt === null) {
    return "No further reviews are scheduled.";
  }

  const days = calendarDaysFrom(now, dueAt);
  if (days < 0) {
    return "The next review is waiting now.";
  }
  if (days === 0) {
    return "The next review is later today.";
  }
  if (days === 1) {
    return "Next review is tomorrow.";
  }
  return `Next review in ${days} days.`;
}

export function formatTodaySummary(attemptCount: number): string {
  if (attemptCount <= 0) {
    return "You have not answered anything today.";
  }
  if (attemptCount === 1) {
    return "One answer recorded today.";
  }
  return `${attemptCount} answers recorded today.`;
}

export function formatAnswersRecorded(count: number): string {
  const noun = count === 1 ? "answer" : "answers";
  return `${capitalize(countWord(count))} ${noun} recorded.`;
}

export function formatIdeasHeld(held: number, total: number): string {
  if (total <= 0) {
    return "No answers recorded.";
  }
  if (total === 1) {
    return held >= 1 ? "This idea held." : "This idea did not hold.";
  }
  if (held <= 0) {
    return `None of ${countWord(total)} ideas held.`;
  }
  return `${capitalize(countWord(held))} of ${countWord(total)} ideas held.`;
}

export function formatAverageScore(scores: readonly number[]): string | null {
  if (scores.length === 0) {
    return null;
  }
  const average =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return `Average score ${Math.round(average * 100)}%.`;
}

export function formatVerdict(verdict: GradeVerdict): string {
  switch (verdict) {
    case "correct":
      return "Correct";
    case "partial":
      return "Partially correct";
    case "incorrect":
      return "Incorrect";
  }
}

export function formatSessionNote(
  topics: readonly SessionTopicResult[],
): string {
  const weak = topics.find((topic) => topic.verdict !== "correct");
  if (weak !== undefined) {
    return `${weak.name} needs another pass.`;
  }
  if (topics.length === 0) {
    return "Your answers are saved.";
  }
  return "These ideas are holding for now.";
}

export function summarizeSessionTopics(
  results: readonly SessionTopicResult[],
): SessionTopicResult[] {
  const byName = new Map<string, GradeVerdict[]>();
  for (const result of results) {
    const current = byName.get(result.name) ?? [];
    current.push(result.verdict);
    byName.set(result.name, current);
  }

  return [...byName.entries()].map(([name, verdicts]) => ({
    name,
    verdict: weakestVerdict(verdicts),
  }));
}

function weakestVerdict(verdicts: readonly GradeVerdict[]): GradeVerdict {
  if (verdicts.includes("incorrect")) {
    return "incorrect";
  }
  if (verdicts.includes("partial")) {
    return "partial";
  }
  return "correct";
}

export function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function isSameLocalDay(isoDate: string, now: Date): boolean {
  const parsed = Date.parse(isoDate);
  if (Number.isNaN(parsed)) {
    return false;
  }
  return startOfLocalDay(new Date(parsed)) === startOfLocalDay(now);
}

function calendarDaysFrom(from: Date, to: Date): number {
  return Math.round((startOfLocalDay(to) - startOfLocalDay(from)) / MS_PER_DAY);
}

function countWord(count: number): string {
  if (count >= 0 && count < SMALL_COUNTS.length) {
    const word = SMALL_COUNTS[count];
    return word ?? String(count);
  }
  return String(count);
}

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}
