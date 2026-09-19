import { describe, expect, it } from "vitest";

import {
  formatDayTooltip,
  formatHeatmapSummary,
  formatProgressHeading,
  formatStreak,
  heatmapLevel,
  scoreChartPoints,
  sortProgressTopics,
} from "@/lib/progress/format";
import type { ProgressTopic } from "@/lib/progress/types";

function topic(overrides: Partial<ProgressTopic> & Pick<ProgressTopic, "id" | "name">): ProgressTopic {
  return {
    documentId: "doc-a",
    documentTitle: "Sample lecture",
    dueCount: 0,
    masteryState: "learning",
    masteryValue: 0,
    questionCount: 4,
    ...overrides,
  };
}

describe("formatProgressHeading", () => {
  it("names the weakest topic", () => {
    expect(
      formatProgressHeading([
        topic({
          id: "t1",
          name: "Limitations of Dijkstra's algorithm",
          masteryValue: 0,
        }),
      ]),
    ).toBe("Limitations of Dijkstra's algorithm needs another pass.");
  });

  it("uses the empty-state heading when there are no topics", () => {
    expect(formatProgressHeading([])).toBe(
      "Your first answers will become a study map.",
    );
  });

  it("treats an all-solid list as holding", () => {
    expect(
      formatProgressHeading([
        topic({
          id: "t1",
          name: "Graph basics",
          masteryState: "solid",
          masteryValue: 0.9,
        }),
      ]),
    ).toBe("These ideas are holding.");
  });
});

describe("formatStreak", () => {
  it("uses editorial copy for 0, 1, and several days", () => {
    expect(formatStreak(0)).toBe("No current streak.");
    expect(formatStreak(1)).toBe("One study day so far.");
    expect(formatStreak(2)).toBe("Two study days in a row.");
  });
});

describe("heatmapLevel", () => {
  it("maps empty and relative intensity", () => {
    expect(heatmapLevel(0, 12)).toBe(0);
    expect(heatmapLevel(1, 12)).toBe(1);
    expect(heatmapLevel(12, 12)).toBe(4);
  });
});

describe("formatDayTooltip", () => {
  it("pairs the date with counts and average", () => {
    expect(
      formatDayTooltip({
        attemptCount: 0,
        averageScore: null,
        day: "2026-09-19",
      }),
    ).toContain("no answers");
    expect(
      formatDayTooltip({
        attemptCount: 8,
        averageScore: 0.42,
        day: "2026-09-19",
      }),
    ).toMatch(/8 answers, average 42%/);
  });
});

describe("formatHeatmapSummary", () => {
  it("counts active days", () => {
    expect(
      formatHeatmapSummary([
        { attemptCount: 0, averageScore: null, day: "2026-09-18" },
        { attemptCount: 3, averageScore: 0.2, day: "2026-09-19" },
      ]),
    ).toMatch(/1 day/);
  });
});

describe("sortProgressTopics", () => {
  const topics = [
    topic({
      id: "solid",
      name: "Graph basics",
      masteryValue: 0.8,
      masteryState: "solid",
      dueCount: 1,
    }),
    topic({
      id: "weak-more-due",
      name: "Negative weights in graphs",
      masteryValue: 0,
      dueCount: 4,
    }),
    topic({
      id: "weak-less-due",
      name: "Limitations of Dijkstra's algorithm",
      masteryValue: 0,
      dueCount: 2,
    }),
  ];

  it("sorts weakest first, then most due", () => {
    expect(sortProgressTopics(topics, "weakest").map((item) => item.id)).toEqual([
      "weak-more-due",
      "weak-less-due",
      "solid",
    ]);
  });

  it("sorts most due first", () => {
    expect(sortProgressTopics(topics, "due").map((item) => item.id)).toEqual([
      "weak-more-due",
      "weak-less-due",
      "solid",
    ]);
  });
});

describe("scoreChartPoints", () => {
  it("keeps only days with scores", () => {
    expect(
      scoreChartPoints([
        { attemptCount: 0, averageScore: null, day: "2026-09-18" },
        { attemptCount: 2, averageScore: 0.5, day: "2026-09-19" },
      ]),
    ).toEqual([
      {
        attemptCount: 2,
        day: "2026-09-19",
        label: "19 Sept",
        percent: 50,
      },
    ]);
  });
});
