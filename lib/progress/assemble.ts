import { RECENT_MASTERY_LIMIT, topicMastery } from "@/lib/scheduler";
import { sortProgressTopics } from "@/lib/progress/format";
import type {
  ProgressDashboard,
  ProgressDay,
  ProgressTopic,
} from "@/lib/progress/types";

export type ProgressDocumentRow = {
  id: string;
  title: string;
};

export type ProgressTopicRow = {
  documentId: string;
  id: string;
  name: string;
};

export type ProgressQuestionRow = {
  documentId: string;
  id: string;
  topicId: string;
};

export type ProgressReviewRow = {
  dueAt: string | null;
  questionId: string;
};

export type ProgressAttemptRow = {
  createdAt: string;
  questionId: string;
  score: number;
};

export type ProgressSource = {
  attempts: readonly ProgressAttemptRow[];
  documents: readonly ProgressDocumentRow[];
  now: Date;
  questions: readonly ProgressQuestionRow[];
  reviews: readonly ProgressReviewRow[];
  timeZone: string;
  topics: readonly ProgressTopicRow[];
};

export function assembleProgressDashboard(
  source: ProgressSource,
): ProgressDashboard {
  const documentsById = new Map(
    source.documents.map((document) => [document.id, document]),
  );
  const questionsByTopic = new Map<string, ProgressQuestionRow[]>();
  for (const question of source.questions) {
    const current = questionsByTopic.get(question.topicId) ?? [];
    current.push(question);
    questionsByTopic.set(question.topicId, current);
  }

  const dueAtByQuestion = new Map(
    source.reviews.map((review) => [review.questionId, review.dueAt]),
  );
  const attemptsByTopic = new Map<string, { at: number; score: number }[]>();
  const questionById = new Map(
    source.questions.map((question) => [question.id, question]),
  );
  for (const attempt of source.attempts) {
    const question = questionById.get(attempt.questionId);
    if (question === undefined) {
      continue;
    }
    const current = attemptsByTopic.get(question.topicId) ?? [];
    current.push({
      at: Date.parse(attempt.createdAt),
      score: attempt.score,
    });
    attemptsByTopic.set(question.topicId, current);
  }

  const nowMs = source.now.getTime();
  const topics: ProgressTopic[] = [];
  for (const topic of source.topics) {
    const document = documentsById.get(topic.documentId);
    const questions = questionsByTopic.get(topic.id) ?? [];
    if (document === undefined || questions.length === 0) {
      continue;
    }
    const attempts = attemptsByTopic.get(topic.id) ?? [];
    attempts.sort((left, right) => left.at - right.at);
    const mastery = topicMastery(
      attempts.slice(-RECENT_MASTERY_LIMIT).map((attempt) => attempt.score),
    );
    const dueCount = questions.filter((question) => {
      const dueAt = dueAtByQuestion.get(question.id);
      if (dueAt === undefined || dueAt === null) {
        return true;
      }
      return Date.parse(dueAt) <= nowMs;
    }).length;
    topics.push({
      documentId: document.id,
      documentTitle: document.title,
      dueCount,
      id: topic.id,
      masteryState: mastery.state,
      masteryValue: roundToFour(mastery.value),
      name: topic.name,
      questionCount: questions.length,
    });
  }

  return {
    attemptCount: source.attempts.length,
    days: calendarDays(source.attempts, source.now, source.timeZone),
    hasQuestions: source.questions.length > 0,
    streak: studyStreak(source.attempts, source.now, source.timeZone),
    topics: sortProgressTopics(topics, "weakest"),
  };
}

export function calendarDays(
  attempts: readonly ProgressAttemptRow[],
  now: Date,
  timeZone: string,
): ProgressDay[] {
  const today = dateKeyInZone(now, timeZone);
  const start = mondayOnOrBefore(addDays(today, -83));
  const totals = new Map<string, { count: number; sum: number }>();
  for (const attempt of attempts) {
    const parsed = Date.parse(attempt.createdAt);
    if (Number.isNaN(parsed)) {
      continue;
    }
    const day = dateKeyInZone(new Date(parsed), timeZone);
    const current = totals.get(day) ?? { count: 0, sum: 0 };
    current.count += 1;
    current.sum += attempt.score;
    totals.set(day, current);
  }

  const days: ProgressDay[] = [];
  for (let cursor = start; cursor <= today; cursor = addDays(cursor, 1)) {
    const total = totals.get(cursor);
    days.push({
      attemptCount: total?.count ?? 0,
      averageScore:
        total === undefined || total.count === 0
          ? null
          : total.sum / total.count,
      day: cursor,
    });
  }
  return days;
}

export function studyStreak(
  attempts: readonly ProgressAttemptRow[],
  now: Date,
  timeZone: string,
): ProgressDashboard["streak"] {
  const uniqueDays = [
    ...new Set(
      attempts.flatMap((attempt) => {
        const parsed = Date.parse(attempt.createdAt);
        return Number.isNaN(parsed)
          ? []
          : [dateKeyInZone(new Date(parsed), timeZone)];
      }),
    ),
  ].sort();

  if (uniqueDays.length === 0) {
    return { current: 0, longest: 0, studyDays: 0 };
  }

  const islands: { end: string; length: number }[] = [];
  let previous = uniqueDays[0];
  let length = 1;
  if (previous === undefined) {
    return { current: 0, longest: 0, studyDays: 0 };
  }

  for (const day of uniqueDays.slice(1)) {
    if (day === addDays(previous, 1)) {
      length += 1;
      previous = day;
      continue;
    }
    islands.push({ end: previous, length });
    previous = day;
    length = 1;
  }
  islands.push({ end: previous, length });

  const today = dateKeyInZone(now, timeZone);
  const yesterday = addDays(today, -1);
  const currentIsland = [...islands]
    .reverse()
    .find((island) => island.end === today || island.end === yesterday);

  return {
    current: currentIsland?.length ?? 0,
    longest: Math.max(...islands.map((island) => island.length)),
    studyDays: uniqueDays.length,
  };
}

export function dateKeyInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDays(isoDay: string, days: number): string {
  const utc = parseIsoDayUtc(isoDay);
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

function mondayOnOrBefore(isoDay: string): string {
  const utc = parseIsoDayUtc(isoDay);
  const weekday = utc.getUTCDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  utc.setUTCDate(utc.getUTCDate() - daysFromMonday);
  return utc.toISOString().slice(0, 10);
}

function parseIsoDayUtc(isoDay: string): Date {
  const [year, month, day] = isoDay.split("-").map((part) => Number(part));
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
}

function roundToFour(value: number): number {
  return Math.round(value * 10000) / 10000;
}
