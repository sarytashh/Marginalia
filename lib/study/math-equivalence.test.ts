import { describe, expect, it } from "vitest";

import {
  areExpressionsEquivalent,
  finalMathResult,
  findEquivalentReference,
  normalizeMathText,
} from "@/lib/study/math-equivalence";

describe("normalizeMathText", () => {
  it("rewrites typed symbols into parser syntax", () => {
    expect(normalizeMathText("(3/2)√x + 1/(2√x)")).toBe("(3/2)sqrt(x) + 1/(2sqrt(x))");
    expect(normalizeMathText("x² − 3·x")).toBe("x^2 - 3*x");
    expect(normalizeMathText("√(x+1)")).toBe("sqrt(x+1)");
  });
});

describe("finalMathResult", () => {
  it("takes the right-hand side of the final equation", () => {
    expect(finalMathResult("y' = (3/2)√x + 1/(2√x)")).toBe("(3/2)sqrt(x) + 1/(2sqrt(x))");
    expect(finalMathResult("dy/dx = 3/2 x^(1/2) + 1/2 x^(-1/2)")).toBe(
      "3/2 x^(1/2) + 1/2 x^(-1/2)",
    );
  });

  it("finds the result inside a sentence", () => {
    expect(
      finalMathResult("Expanding first, the derivative is dy/dx = 3x^2 + 2. This uses the power rule."),
    ).toBe("3x^2 + 2");
  });

  it("returns a bare expression and rejects prose", () => {
    expect(finalMathResult("(x + 4)^2")).toBe("(x + 4)^2");
    expect(finalMathResult("Gradient descent moves against the gradient.")).toBeNull();
  });
});

describe("areExpressionsEquivalent", () => {
  it("accepts equivalent forms", () => {
    expect(areExpressionsEquivalent("(3/2)sqrt(x) + 1/(2sqrt(x))", "3/2 x^(1/2) + 1/2 x^(-1/2)")).toBe(true);
    expect(areExpressionsEquivalent("(x + 4)^2", "x^2 + 8x + 16")).toBe(true);
    expect(areExpressionsEquivalent("(x - 3)(x + 5)", "(x + 5)(x - 3)")).toBe(true);
  });

  it("rejects different expressions", () => {
    expect(areExpressionsEquivalent("(x + 2)(x + 8)", "(x + 4)^2")).toBe(false);
    expect(areExpressionsEquivalent("2x", "2y")).toBe(false);
    expect(areExpressionsEquivalent("x^2", "x^3")).toBe(false);
  });
});

describe("findEquivalentReference", () => {
  it("matches the real case the local grader marked 0%", () => {
    expect(
      findEquivalentReference("y' = (3/2)√x + 1/(2√x)", "dy/dx = 3/2 x^(1/2) + 1/2 x^(-1/2)"),
    ).toBe("3/2 x^(1/2) + 1/2 x^(-1/2)");
  });

  it("does not credit a wrong factorization or prose", () => {
    expect(findEquivalentReference("(x + 2)(x + 8)", "(x + 4)^2")).toBeNull();
    expect(findEquivalentReference("It is a square", "(x + 4)^2")).toBeNull();
  });
});
