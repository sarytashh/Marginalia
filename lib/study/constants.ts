export const DEFAULT_SESSION_LENGTH = 10;

export const SESSION_LENGTHS = [5, 10, 20] as const;

export const SESSION_LENGTH_STORAGE_KEY = "marginalia.sessionLength";

export const SCORE_CORRECT = 0.8;

export const SCORE_PARTIAL = 0.5;

export const GRADE_FAILED_MESSAGE =
  "Marginalia could not grade this answer right now. Your response is safe.";

// Keeps grading prompts bounded. Long enough for any real short answer.
export const MAX_ANSWER_CHARS = 4000;
