import type { SessionCandidate } from "@/lib/study/types";

export type SelectSessionOptions = {
  documentId?: string | null;
  includeAhead: boolean;
  limit: number;
  nowMs: number;
  questionId?: string | null;
  topicId?: string | null;
};

export function isQuestionDue(
  dueAtMs: number | null,
  nowMs: number,
): boolean {
  return dueAtMs === null || dueAtMs <= nowMs;
}

export function selectSessionQuestions(
  candidates: readonly SessionCandidate[],
  options: SelectSessionOptions,
): SessionCandidate[] {
  const scoped = candidates.filter((candidate) => matchesScope(candidate, options));

  if (options.questionId) {
    const match = scoped.find((candidate) => candidate.id === options.questionId);
    return match === undefined ? [] : [match];
  }

  const due = scoped
    .filter((candidate) => isQuestionDue(candidate.dueAtMs, options.nowMs))
    .sort((left, right) => compareCandidates(left, right, options.nowMs));

  if (due.length > 0) {
    return takeLimit(due, options.limit);
  }

  const mayStudyAhead =
    options.includeAhead ||
    (options.documentId !== null && options.documentId !== undefined) ||
    (options.topicId !== null && options.topicId !== undefined);

  if (!mayStudyAhead) {
    return [];
  }

  const ahead = [...scoped].sort((left, right) =>
    compareCandidates(left, right, options.nowMs),
  );
  return takeLimit(ahead, options.limit);
}

function matchesScope(
  candidate: SessionCandidate,
  options: SelectSessionOptions,
): boolean {
  if (options.documentId && candidate.documentId !== options.documentId) {
    return false;
  }
  if (options.topicId && candidate.topicId !== options.topicId) {
    return false;
  }
  if (options.questionId && candidate.id !== options.questionId) {
    return false;
  }
  return true;
}

function compareCandidates(
  left: SessionCandidate,
  right: SessionCandidate,
  nowMs: number,
): number {
  if (left.topicMastery !== right.topicMastery) {
    return left.topicMastery - right.topicMastery;
  }

  const leftUnseen = left.attemptCount === 0 ? 0 : 1;
  const rightUnseen = right.attemptCount === 0 ? 0 : 1;
  if (leftUnseen !== rightUnseen) {
    return leftUnseen - rightUnseen;
  }

  const leftDue = dueSortValue(left.dueAtMs, nowMs);
  const rightDue = dueSortValue(right.dueAtMs, nowMs);
  if (leftDue !== rightDue) {
    return leftDue - rightDue;
  }

  return left.id.localeCompare(right.id);
}

function dueSortValue(dueAtMs: number | null, nowMs: number): number {
  return dueAtMs === null ? nowMs : dueAtMs;
}

function takeLimit(
  candidates: readonly SessionCandidate[],
  limit: number,
): SessionCandidate[] {
  if (!Number.isFinite(limit)) {
    return [...candidates];
  }
  return candidates.slice(0, Math.max(0, limit));
}
