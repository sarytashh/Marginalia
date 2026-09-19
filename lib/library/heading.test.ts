import { describe, expect, it } from "vitest";

import {
  formatDueNavLabel,
  formatLibraryHeading,
  formatLibrarySummary,
} from "@/lib/library/heading";

describe("formatLibraryHeading", () => {
  it("names how many questions are waiting", () => {
    expect(formatLibraryHeading(1, 8)).toBe("One question is waiting.");
    expect(formatLibraryHeading(12, 20)).toBe("Twelve questions are waiting.");
    expect(formatLibraryHeading(13, 20)).toBe("13 questions are waiting.");
  });

  it("treats a library with questions but nothing due as caught up", () => {
    expect(formatLibraryHeading(0, 8)).toBe("You are caught up.");
  });

  it("uses a quieter heading when no questions exist yet", () => {
    expect(formatLibraryHeading(0, 0)).toBe("Your materials.");
  });
});

describe("formatLibrarySummary", () => {
  it("points to the scheduled review when questions are due", () => {
    expect(formatLibrarySummary(3, 10)).toMatch(/already scheduled/);
  });
});

describe("formatDueNavLabel", () => {
  it("omits a label when nothing is due", () => {
    expect(formatDueNavLabel(0)).toBeNull();
  });

  it("pairs the count with the word due", () => {
    expect(formatDueNavLabel(1)).toBe("1 due");
    expect(formatDueNavLabel(12)).toBe("12 due");
  });
});
