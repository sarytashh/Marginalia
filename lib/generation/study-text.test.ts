import { describe, expect, it } from "vitest";

import { keepStudyPassages, stripBoilerplate, studyText } from "@/lib/generation/study-text";

const lecture =
  "A function f is continuous at a point c when the limit of f(x) as x approaches c exists and equals f(c). " +
  "Polynomials are continuous everywhere, and rational functions are continuous wherever the denominator is not zero. " +
  "The Intermediate Value Theorem uses continuity on a closed interval.";

describe("stripBoilerplate", () => {
  it("removes copyright and publisher sentences but keeps the lecture", () => {
    const page = `Copyright © 2010 Pearson Education, Inc. Publishing as Pearson Addison-Wesley. ${lecture}`;
    const cleaned = stripBoilerplate(page);
    expect(cleaned).not.toMatch(/Pearson|Copyright/);
    expect(cleaned).toContain("continuous at a point c");
  });
});

describe("studyText", () => {
  it("drops a title page that is only a copyright notice", () => {
    expect(
      studyText("Copyright © 2010 Pearson Education, Inc. Publishing as Pearson Addison-Wesley Chapter 2 Limits and Continuity"),
    ).toBeNull();
  });

  it("drops an answer key", () => {
    const key =
      "Exercise 6.1 1. (a) 0 (b) −6 2. 1 4 Exercise 6.2 1. (a) x2 2 , yes (b) x, yes (c) x6 6 , yes (d) x2 + x, yes " +
      "(e) √x, contained in (0, ∞) (f) 2 3 x 3 2 2. x5 5 (a) 1 5 (b) 242 5 (c) 243 5 3. (a) 12 (b) 7 4. 18 5. 21";
    expect(studyText(key)).toBeNull();
  });

  it("drops a table of contents", () => {
    const toc =
      "Contents 1 Functions ........ 1 2 Limits and Continuity ........ 45 3 Derivatives ........ 97 4 Applications ........ 150 " +
      "5 Integrals ........ 210 6 Techniques of Integration ........ 260";
    expect(studyText(toc)).toBeNull();
  });

  it("keeps ordinary lecture text, including worked examples with numbers", () => {
    expect(studyText(lecture)).toBe(lecture);
    const example =
      "Example 3. Find the limit of (x^2 - 1)/(x - 1) as x approaches 1. Factor the numerator as (x - 1)(x + 1), " +
      "cancel the common factor, and substitute x = 1 to get 2. This works because the two functions agree everywhere except at x = 1.";
    expect(studyText(example)).not.toBeNull();
  });
});

describe("keepStudyPassages", () => {
  it("filters and cleans passages", () => {
    const kept = keepStudyPassages([
      { id: "title", content: "Copyright © 2010 Pearson Education, Inc." },
      { id: "lecture", content: `Copyright © 2010 Pearson. ${lecture}` },
    ]);
    expect(kept.map((passage) => passage.id)).toEqual(["lecture"]);
    expect(kept[0]?.content).not.toMatch(/Copyright/);
  });

  it("falls back to the original passages when nothing would remain", () => {
    const only = [{ id: "title", content: "Copyright © 2010 Pearson Education, Inc." }];
    expect(keepStudyPassages(only)).toEqual(only);
  });
});
