import { describe, expect, it } from "vitest";

import {
  addDays,
  assembleProgressDashboard,
  calendarDays,
  dateKeyInZone,
  studyStreak,
} from "@/lib/progress/assemble";

const NOW = new Date("2026-09-19T16:13:00.000Z");
const ZONE = "Asia/Shanghai";

describe("dateKeyInZone", () => {
  it("uses the local calendar date, not UTC", () => {
    expect(dateKeyInZone(new Date("2026-09-19T15:59:00.000Z"), ZONE)).toBe(
      "2026-09-19",
    );
    expect(dateKeyInZone(new Date("2026-09-19T16:00:00.000Z"), ZONE)).toBe(
      "2026-09-20",
    );
  });
});

describe("calendarDays", () => {
  it("aligns the window to Monday and fills empty days", () => {
    const days = calendarDays(
      [
        {
          createdAt: "2026-09-19T16:13:00.000Z",
          questionId: "q1",
          score: 1,
        },
      ],
      NOW,
      ZONE,
    );
    expect(days[0]?.day).toBe("2026-06-29");
    expect(new Date(`${days[0]?.day}T00:00:00.000Z`).getUTCDay()).toBe(1);
    expect(days.at(-1)?.day).toBe("2026-09-20");
    const active = days.filter((day) => day.attemptCount > 0);
    expect(active).toEqual([
      {
        attemptCount: 1,
        averageScore: 1,
        day: "2026-09-20",
      },
    ]);
  });
});

describe("studyStreak", () => {
  it("counts consecutive local days ending today or yesterday", () => {
    const streak = studyStreak(
      [
        {
          createdAt: "2026-09-19T15:30:00.000Z",
          questionId: "q1",
          score: 0,
        },
        {
          createdAt: "2026-09-19T16:13:00.000Z",
          questionId: "q2",
          score: 1,
        },
      ],
      NOW,
      ZONE,
    );
    expect(streak).toEqual({ current: 2, longest: 2, studyDays: 2 });
  });

  it("resets when the last study day is older than yesterday", () => {
    expect(
      studyStreak(
        [
          {
            createdAt: "2026-09-16T12:00:00.000Z",
            questionId: "q1",
            score: 1,
          },
        ],
        NOW,
        ZONE,
      ).current,
    ).toBe(0);
  });
});

describe("assembleProgressDashboard", () => {
  it("sorts weakest topics first and treats missing reviews as due", () => {
    const dashboard = assembleProgressDashboard({
      now: NOW,
      timeZone: ZONE,
      documents: [{ id: "doc-1", title: "Sample lecture" }],
      topics: [
        { id: "solid", name: "Graph basics", documentId: "doc-1" },
        { id: "weak", name: "Limitations", documentId: "doc-1" },
        { id: "empty", name: "Bellman-Ford", documentId: "doc-1" },
      ],
      questions: [
        { id: "q-solid", topicId: "solid", documentId: "doc-1" },
        { id: "q-weak", topicId: "weak", documentId: "doc-1" },
      ],
      reviews: [
        {
          questionId: "q-solid",
          dueAt: addDays(dateKeyInZone(NOW, ZONE), 1) + "T00:00:00.000Z",
        },
      ],
      attempts: [
        {
          createdAt: "2026-09-19T15:30:00.000Z",
          questionId: "q-solid",
          score: 1,
        },
        {
          createdAt: "2026-09-19T15:31:00.000Z",
          questionId: "q-weak",
          score: 0,
        },
      ],
    });

    expect(dashboard.topics.map((topic) => topic.id)).toEqual(["weak", "solid"]);
    expect(dashboard.topics[0]?.masteryState).toBe("learning");
    expect(dashboard.topics[0]?.dueCount).toBe(1);
    expect(dashboard.topics[1]?.dueCount).toBe(0);
    expect(dashboard.hasQuestions).toBe(true);
    expect(dashboard.attemptCount).toBe(2);
  });
});
