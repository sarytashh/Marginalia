import { describe, expect, it } from "vitest";

import {
  encodeGradeStreamEvent,
  parseGradeStreamEvent,
} from "@/lib/study/events";
import type { GradeFeedback } from "@/lib/study/types";

const feedback: GradeFeedback = {
  attemptId: "att_1",
  score: 0.7,
  verdict: "partial",
  whatYouGotRight: ["You mentioned the frontier."],
  whatYouMissed: ["The queue is ordered by distance."],
  explanation: "The passage keeps unsettled vertices in a priority queue.",
  referenceAnswer: "A complete answer.",
  sourceExcerpt: "The frontier is a priority queue.",
  supportingSentence: "The frontier is a priority queue.",
  correctChoiceId: null,
};

describe("grade stream events", () => {
  it("round-trips a result event", () => {
    const encoded = encodeGradeStreamEvent({ type: "result", feedback });
    expect(parseGradeStreamEvent(encoded)).toEqual({
      type: "result",
      feedback,
    });
  });

  it("parses explanation and error lines", () => {
    expect(parseGradeStreamEvent('{"type":"explanation","text":"Hello"}')).toEqual({
      type: "explanation",
      text: "Hello",
    });
    expect(parseGradeStreamEvent('{"type":"error","message":"Busy"}')).toEqual({
      type: "error",
      message: "Busy",
    });
  });

  it("ignores blank and malformed lines", () => {
    expect(parseGradeStreamEvent("")).toBeNull();
    expect(parseGradeStreamEvent("{")).toBeNull();
  });
});
