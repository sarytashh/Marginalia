import { describe, expect, it } from "vitest";

import { DEFAULT_SESSION_LENGTH } from "@/lib/study/constants";
import { buildStudyHref, hasInvalidStudyFilter, parseStudySearchParams } from "@/lib/study/params";

describe("parseStudySearchParams", () => {
  it("defaults to a ten-question due session", () => {
    expect(parseStudySearchParams({})).toEqual({
      documentId: null,
      topicId: null,
      questionId: null,
      includeAhead: false,
      limit: DEFAULT_SESSION_LENGTH,
      lengthLabel: DEFAULT_SESSION_LENGTH,
    });
  });

  it("reads document, topic, question, ahead, and length", () => {
    const documentId = "11111111-1111-4111-8111-111111111111";
    const topicId = "22222222-2222-4222-8222-222222222222";
    const parsed = parseStudySearchParams({
      document: documentId,
      topic: topicId,
      ahead: "1",
      length: "all",
    });

    expect(parsed.documentId).toBe(documentId);
    expect(parsed.topicId).toBe(topicId);
    expect(parsed.includeAhead).toBe(true);
    expect(parsed.limit).toBe(Number.POSITIVE_INFINITY);
    expect(parsed.lengthLabel).toBe("all");
  });

  it("ignores unknown lengths and flags an invalid uuid filter", () => {
    const parsed = parseStudySearchParams({
      document: "not-a-uuid",
      length: "7",
      ahead: "nope",
    });

    expect(parsed.documentId).toBeNull();
    expect(parsed.includeAhead).toBe(false);
    expect(parsed.lengthLabel).toBe(DEFAULT_SESSION_LENGTH);
    expect(hasInvalidStudyFilter({ document: "not-a-uuid" })).toBe(true);
    expect(hasInvalidStudyFilter({})).toBe(false);
  });
});

describe("buildStudyHref", () => {
  it("omits default length and empty filters", () => {
    expect(buildStudyHref({})).toBe("/study");
    expect(buildStudyHref({ ahead: true, length: 5 })).toBe(
      "/study?ahead=1&length=5",
    );
  });
});
