import {
  DEFAULT_SESSION_LENGTH,
  SESSION_LENGTHS,
} from "@/lib/study/constants";
import type { StudySessionScope } from "@/lib/study/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type StudySearchParams = {
  ahead?: string | string[];
  document?: string | string[];
  length?: string | string[];
  question?: string | string[];
  topic?: string | string[];
};

export function parseStudySearchParams(
  params: StudySearchParams,
): Omit<StudySessionScope, "documentTitle"> {
  const length = parseSessionLength(firstValue(params.length));
  const includeAhead = parseBooleanFlag(firstValue(params.ahead));
  const documentId = parseUuid(firstValue(params.document));
  const topicId = parseUuid(firstValue(params.topic));
  const questionId = parseUuid(firstValue(params.question));

  return {
    documentId,
    topicId,
    questionId,
    includeAhead,
    limit: length === "all" ? Number.POSITIVE_INFINITY : length,
    lengthLabel: length,
  };
}

export function hasInvalidStudyFilter(params: StudySearchParams): boolean {
  return (
    isInvalidUuidParam(params.document) ||
    isInvalidUuidParam(params.topic) ||
    isInvalidUuidParam(params.question)
  );
}

export function parseSessionLength(raw: string | undefined): number | "all" {
  if (raw === undefined) {
    return DEFAULT_SESSION_LENGTH;
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized === "all") {
    return "all";
  }

  const value = Number.parseInt(normalized, 10);
  if ((SESSION_LENGTHS as readonly number[]).includes(value)) {
    return value;
  }

  return DEFAULT_SESSION_LENGTH;
}

export function buildStudyHref(input: {
  ahead?: boolean;
  documentId?: string | null;
  length?: number | "all";
  questionId?: string | null;
  topicId?: string | null;
}): string {
  const search = new URLSearchParams();
  if (input.documentId) {
    search.set("document", input.documentId);
  }
  if (input.topicId) {
    search.set("topic", input.topicId);
  }
  if (input.questionId) {
    search.set("question", input.questionId);
  }
  if (input.ahead) {
    search.set("ahead", "1");
  }
  if (input.length !== undefined && input.length !== DEFAULT_SESSION_LENGTH) {
    search.set("length", String(input.length));
  }

  const query = search.toString();
  return query === "" ? "/study" : `/study?${query}`;
}

function parseBooleanFlag(raw: string | undefined): boolean {
  if (raw === undefined) {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function parseUuid(raw: string | undefined): string | null {
  if (raw === undefined) {
    return null;
  }
  const value = raw.trim();
  return UUID_PATTERN.test(value) ? value : null;
}

function isInvalidUuidParam(value: string | string[] | undefined): boolean {
  const raw = firstValue(value);
  if (raw === undefined || raw.trim() === "") {
    return false;
  }
  return parseUuid(raw) === null;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
