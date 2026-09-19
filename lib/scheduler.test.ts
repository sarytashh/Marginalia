import { describe, expect, it } from "vitest";

import {
  DEFAULT_EASE,
  DUE_AT_JITTER_FRACTION,
  FIRST_INTERVAL_DAYS,
  MAX_EASE,
  MAX_INTERVAL_DAYS,
  MIN_EASE,
  MS_PER_DAY,
  SECOND_INTERVAL_DAYS,
  defaultReviewState,
  schedule,
  topicMastery,
  type ReviewState,
} from "@/lib/scheduler";

const NOW = new Date("2026-09-20T04:00:00.000Z");
const NO_JITTER = { random: () => 0.5 } as const;

function state(overrides: Partial<ReviewState> = {}): ReviewState {
  return {
    ...defaultReviewState(NOW),
    ...overrides,
  };
}

function dueOffsetMs(next: ReviewState, now: Date = NOW): number {
  return next.dueAt.getTime() - now.getTime();
}

describe("schedule", () => {
  it("treats a score of 0.8 as correct: first review in 1 day", () => {
    const next = schedule(state(), 0.8, NOW, NO_JITTER);

    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBe(FIRST_INTERVAL_DAYS);
    expect(next.ease).toBe(2.6);
    expect(dueOffsetMs(next)).toBe(MS_PER_DAY);
  });

  it("schedules the second correct answer 3 days out", () => {
    const first = schedule(state(), 1, NOW, NO_JITTER);
    const second = schedule(first, 1, first.dueAt, NO_JITTER);

    expect(second.repetitions).toBe(2);
    expect(second.intervalDays).toBe(SECOND_INTERVAL_DAYS);
    expect(second.ease).toBe(2.7);
    expect(dueOffsetMs(second, first.dueAt)).toBe(3 * MS_PER_DAY);
  });

  it("multiplies the previous interval by ease from the third correct answer", () => {
    const first = schedule(state(), 1, NOW, NO_JITTER);
    const second = schedule(first, 1, first.dueAt, NO_JITTER);
    const third = schedule(second, 1, second.dueAt, NO_JITTER);

    expect(third.repetitions).toBe(3);
    expect(third.intervalDays).toBe(Math.round(SECOND_INTERVAL_DAYS * second.ease));
    expect(third.intervalDays).toBe(8);
    expect(third.ease).toBe(2.8);
  });

  it("grows intervals across a long correct streak until the 180-day cap", () => {
    let current = state();
    let now = NOW;
    const intervals: number[] = [];

    for (let step = 0; step < 12; step += 1) {
      current = schedule(current, 1, now, NO_JITTER);
      intervals.push(current.intervalDays);
      now = current.dueAt;
    }

    expect(intervals.slice(0, 6)).toEqual([1, 3, 8, 22, 64, 180]);
    expect(intervals.slice(6).every((days) => days === MAX_INTERVAL_DAYS)).toBe(
      true,
    );
    expect(current.ease).toBe(MAX_EASE);
    expect(current.repetitions).toBe(12);
  });

  it("caps ease at 3.0 after a correct answer", () => {
    const next = schedule(state({ ease: 2.95 }), 1, NOW, NO_JITTER);
    expect(next.ease).toBe(MAX_EASE);
  });

  it("treats a score of 0.5 as shaky: 1-day interval and a small ease drop", () => {
    const next = schedule(
      state({
        ease: 2.5,
        intervalDays: 22,
        repetitions: 4,
      }),
      0.5,
      NOW,
      NO_JITTER,
    );

    expect(next.repetitions).toBe(4);
    expect(next.intervalDays).toBe(1);
    expect(next.ease).toBe(2.45);
    expect(dueOffsetMs(next)).toBe(MS_PER_DAY);
  });

  it("treats scores between 0.5 and 0.8 as shaky", () => {
    const next = schedule(state({ ease: 2.5 }), 0.79, NOW, NO_JITTER);
    expect(next.intervalDays).toBe(1);
    expect(next.repetitions).toBe(0);
    expect(next.ease).toBe(2.45);
  });

  it("treats a score below 0.5 as wrong: due now, repetitions reset", () => {
    const next = schedule(
      state({
        ease: 2.5,
        intervalDays: 22,
        repetitions: 4,
      }),
      0.49,
      NOW,
      NO_JITTER,
    );

    expect(next.repetitions).toBe(0);
    expect(next.intervalDays).toBe(0);
    expect(next.ease).toBe(2.3);
    expect(next.dueAt.getTime()).toBe(NOW.getTime());
  });

  it("resets a long streak after a wrong answer so the card is due immediately", () => {
    let current = state();
    let now = NOW;
    for (let step = 0; step < 8; step += 1) {
      current = schedule(current, 1, now, NO_JITTER);
      now = current.dueAt;
    }

    expect(current.intervalDays).toBe(MAX_INTERVAL_DAYS);
    expect(current.repetitions).toBe(8);

    const failed = schedule(current, 0, now, NO_JITTER);
    expect(failed.repetitions).toBe(0);
    expect(failed.intervalDays).toBe(0);
    expect(failed.dueAt.getTime()).toBe(now.getTime());
    expect(failed.ease).toBe(2.8);

    const recovered = schedule(failed, 1, failed.dueAt, NO_JITTER);
    expect(recovered.repetitions).toBe(1);
    expect(recovered.intervalDays).toBe(1);
  });

  it("floors ease at 1.3 on a wrong or shaky answer", () => {
    expect(schedule(state({ ease: 1.3 }), 0, NOW, NO_JITTER).ease).toBe(
      MIN_EASE,
    );
    expect(schedule(state({ ease: 1.4 }), 0, NOW, NO_JITTER).ease).toBe(
      MIN_EASE,
    );
    expect(schedule(state({ ease: MIN_EASE }), 0.6, NOW, NO_JITTER).ease).toBe(
      MIN_EASE,
    );
  });

  it("does not clump same-interval reviews: jitter is a few percent of due_at", () => {
    const learned = state({ intervalDays: 1, repetitions: 0 });
    const early = schedule(learned, 1, NOW, { random: () => 0 });
    const late = schedule(learned, 1, NOW, { random: () => 1 });
    const middle = schedule(learned, 1, NOW, NO_JITTER);

    expect(dueOffsetMs(middle)).toBe(MS_PER_DAY);
    expect(dueOffsetMs(early)).toBe(MS_PER_DAY * (1 - DUE_AT_JITTER_FRACTION));
    expect(dueOffsetMs(late)).toBe(MS_PER_DAY * (1 + DUE_AT_JITTER_FRACTION));
  });

  it("does not jitter a zero-interval (still-due) card", () => {
    const early = schedule(state(), 0, NOW, { random: () => 0 });
    const late = schedule(state(), 0, NOW, { random: () => 1 });
    expect(early.dueAt.getTime()).toBe(NOW.getTime());
    expect(late.dueAt.getTime()).toBe(NOW.getTime());
  });

  it("does not mutate the current review state", () => {
    const current = state({
      dueAt: new Date("2026-01-01T00:00:00.000Z"),
      ease: DEFAULT_EASE,
      intervalDays: 3,
      repetitions: 2,
    });
    const snapshot = {
      dueAt: current.dueAt.getTime(),
      ease: current.ease,
      intervalDays: current.intervalDays,
      repetitions: current.repetitions,
    };

    schedule(current, 1, NOW, NO_JITTER);

    expect(current.dueAt.getTime()).toBe(snapshot.dueAt);
    expect(current.ease).toBe(snapshot.ease);
    expect(current.intervalDays).toBe(snapshot.intervalDays);
    expect(current.repetitions).toBe(snapshot.repetitions);
  });

  it("clamps out-of-range scores onto the same branches", () => {
    expect(schedule(state(), 1.4, NOW, NO_JITTER).intervalDays).toBe(1);
    expect(schedule(state(), -2, NOW, NO_JITTER).intervalDays).toBe(0);
    expect(schedule(state(), Number.NaN, NOW, NO_JITTER).intervalDays).toBe(0);
  });
});

describe("topicMastery", () => {
  it("returns new and 0 for an empty history", () => {
    expect(topicMastery([])).toEqual({ state: "new", value: 0 });
  });

  it("marks a low recent average as learning", () => {
    expect(topicMastery([0])).toEqual({ state: "learning", value: 0 });
    expect(topicMastery([0.49]).state).toBe("learning");
  });

  it("uses 0.5 as the shaky boundary and 0.8 as solid", () => {
    expect(topicMastery([0.5])).toEqual({ state: "shaky", value: 0.5 });
    expect(topicMastery([0.79]).state).toBe("shaky");
    expect(topicMastery([0.8])).toEqual({ state: "solid", value: 0.8 });
    expect(topicMastery([1]).state).toBe("solid");
  });

  it("weights later attempts more heavily than earlier ones", () => {
    const improved = topicMastery([0, 1]);
    const slipped = topicMastery([1, 0]);

    expect(improved.value).toBeCloseTo(2 / 3);
    expect(slipped.value).toBeCloseTo(1 / 3);
    expect(improved.state).toBe("shaky");
    expect(slipped.state).toBe("learning");
    expect(improved.value).toBeGreaterThan(slipped.value);
  });

  it("treats a consistent high streak as solid", () => {
    const mastery = topicMastery([0.9, 0.85, 1, 0.95]);
    expect(mastery.state).toBe("solid");
    expect(mastery.value).toBeGreaterThan(0.8);
  });
});
