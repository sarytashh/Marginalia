import { SCORE_CORRECT, SCORE_PARTIAL } from "@/lib/study/constants";

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MAX_EASE = 3;
export const MAX_INTERVAL_DAYS = 180;
export const FIRST_INTERVAL_DAYS = 1;
export const SECOND_INTERVAL_DAYS = 3;
export const EASE_BUMP_CORRECT = 0.1;
export const EASE_DROP_SHAKY = 0.05;
export const EASE_DROP_WRONG = 0.2;
export const DUE_AT_JITTER_FRACTION = 0.05;
export const RECENT_MASTERY_LIMIT = 20;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ReviewState = {
  dueAt: Date;
  ease: number;
  intervalDays: number;
  repetitions: number;
};

export type MasteryState = "new" | "learning" | "shaky" | "solid";

export type TopicMastery = {
  state: MasteryState;
  value: number;
};

export type ScheduleOptions = {
  random?: () => number;
};

export function defaultReviewState(now: Date): ReviewState {
  return {
    dueAt: new Date(now.getTime()),
    ease: DEFAULT_EASE,
    intervalDays: 0,
    repetitions: 0,
  };
}

export function schedule(
  current: ReviewState,
  score: number,
  now: Date,
  options: ScheduleOptions = {},
): ReviewState {
  const quality = clampScore(score);
  const random = options.random ?? Math.random;
  let ease = current.ease;
  let intervalDays = current.intervalDays;
  let repetitions = current.repetitions;

  if (quality >= SCORE_CORRECT) {
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = FIRST_INTERVAL_DAYS;
    } else if (repetitions === 2) {
      intervalDays = SECOND_INTERVAL_DAYS;
    } else {
      intervalDays = Math.max(
        1,
        Math.round(current.intervalDays * current.ease),
      );
    }
    ease = current.ease + EASE_BUMP_CORRECT;
  } else if (quality >= SCORE_PARTIAL) {
    intervalDays = FIRST_INTERVAL_DAYS;
    ease = current.ease - EASE_DROP_SHAKY;
  } else {
    repetitions = 0;
    intervalDays = 0;
    ease = current.ease - EASE_DROP_WRONG;
  }

  ease = clamp(roundToHundredths(ease), MIN_EASE, MAX_EASE);
  intervalDays = Math.min(Math.max(intervalDays, 0), MAX_INTERVAL_DAYS);

  return {
    dueAt: dueAtFromInterval(now, intervalDays, random),
    ease,
    intervalDays,
    repetitions,
  };
}

export function topicMastery(recentScores: number[]): TopicMastery {
  if (recentScores.length === 0) {
    return { state: "new", value: 0 };
  }

  let weightedSum = 0;
  let weightTotal = 0;
  for (let index = 0; index < recentScores.length; index += 1) {
    const score = recentScores[index];
    if (score === undefined) {
      continue;
    }
    const weight = index + 1;
    weightedSum += clampScore(score) * weight;
    weightTotal += weight;
  }

  if (weightTotal === 0) {
    return { state: "new", value: 0 };
  }

  const value = weightedSum / weightTotal;
  return { state: masteryStateFromValue(value), value };
}

function masteryStateFromValue(value: number): MasteryState {
  if (value >= SCORE_CORRECT) {
    return "solid";
  }
  if (value >= SCORE_PARTIAL) {
    return "shaky";
  }
  return "learning";
}

function dueAtFromInterval(
  now: Date,
  intervalDays: number,
  random: () => number,
): Date {
  if (intervalDays <= 0) {
    return new Date(now.getTime());
  }

  const jitter = 1 + (random() - 0.5) * 2 * DUE_AT_JITTER_FRACTION;
  return new Date(now.getTime() + intervalDays * MS_PER_DAY * jitter);
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }
  return clamp(score, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToHundredths(value: number): number {
  return Math.round(value * 100) / 100;
}
