import { describe, expect, it } from "vitest";

import {
  formatAnswersRecorded,
  formatAverageScore,
  formatIdeasHeld,
  formatNextReview,
  formatSessionNote,
  formatSessionProgress,
  formatSourceDisclosure,
  formatTodaySummary,
  formatVerdict,
  isSameLocalDay,
  summarizeSessionTopics,
} from "@/lib/study/format";

describe("formatSessionProgress", () => {
  it("zero-pads the current index", () => {
    expect(formatSessionProgress(0, 10)).toBe("01 of 10");
    expect(formatSessionProgress(3, 10)).toBe("04 of 10");
  });
});

describe("formatSourceDisclosure", () => {
  it("pairs the document title with the earliest page", () => {
    expect(formatSourceDisclosure("Sample lecture", [14, 12])).toBe(
      "SAMPLE LECTURE · PAGE 12",
    );
  });
});

describe("formatNextReview", () => {
  const now = new Date(2026, 8, 19, 18, 0, 0);

  it("names tomorrow and whole-day gaps", () => {
    expect(formatNextReview(new Date(2026, 8, 20, 9, 0, 0), now)).toBe(
      "Next review is tomorrow.",
    );
    expect(formatNextReview(new Date(2026, 8, 21, 9, 0, 0), now)).toBe(
      "Next review in 2 days.",
    );
  });

  it("handles missing and already-due reviews", () => {
    expect(formatNextReview(null, now)).toBe("No further reviews are scheduled.");
    expect(formatNextReview(new Date(2026, 8, 18, 9, 0, 0), now)).toBe(
      "The next review is waiting now.",
    );
  });
});

describe("formatAnswersRecorded", () => {
  it("uses editorial number words", () => {
    expect(formatAnswersRecorded(1)).toBe("One answer recorded.");
    expect(formatAnswersRecorded(8)).toBe("Eight answers recorded.");
    expect(formatAnswersRecorded(10)).toBe("Ten answers recorded.");
  });
});

describe("formatTodaySummary", () => {
  it("describes today's attempt count", () => {
    expect(formatTodaySummary(0)).toBe("You have not answered anything today.");
    expect(formatTodaySummary(1)).toBe("One answer recorded today.");
    expect(formatTodaySummary(4)).toBe("4 answers recorded today.");
  });
});

describe("formatIdeasHeld", () => {
  it("uses editorial number words", () => {
    expect(formatIdeasHeld(8, 10)).toBe("Eight of ten ideas held.");
    expect(formatIdeasHeld(0, 5)).toBe("None of five ideas held.");
    expect(formatIdeasHeld(0, 1)).toBe("This idea did not hold.");
    expect(formatIdeasHeld(1, 1)).toBe("This idea held.");
    expect(formatIdeasHeld(0, 0)).toBe("No answers recorded.");
  });
});

describe("formatAverageScore", () => {
  it("returns a percentage from the mean", () => {
    expect(formatAverageScore([1, 0.5])).toBe("Average score 75%.");
    expect(formatAverageScore([])).toBeNull();
  });
});

describe("formatVerdict", () => {
  it("pairs every state with a word", () => {
    expect(formatVerdict("correct")).toBe("Correct");
    expect(formatVerdict("partial")).toBe("Partially correct");
    expect(formatVerdict("incorrect")).toBe("Incorrect");
  });
});

describe("summarizeSessionTopics", () => {
  it("keeps the weakest verdict per topic", () => {
    expect(
      summarizeSessionTopics([
        { name: "Dijkstra", verdict: "correct" },
        { name: "Dijkstra", verdict: "incorrect" },
        { name: "Bellman-Ford", verdict: "partial" },
      ]),
    ).toEqual([
      { name: "Dijkstra", verdict: "incorrect" },
      { name: "Bellman-Ford", verdict: "partial" },
    ]);
  });
});

describe("formatSessionNote", () => {
  it("names a topic that needs another pass", () => {
    expect(
      formatSessionNote([{ name: "Negative edge weights", verdict: "incorrect" }]),
    ).toBe("Negative edge weights needs another pass.");
  });
});

describe("isSameLocalDay", () => {
  it("compares calendar days in local time", () => {
    const now = new Date(2026, 8, 19, 23, 0, 0);
    expect(isSameLocalDay(new Date(2026, 8, 19, 1, 0, 0).toISOString(), now)).toBe(
      true,
    );
    expect(isSameLocalDay(new Date(2026, 8, 18, 23, 0, 0).toISOString(), now)).toBe(
      false,
    );
  });
});
