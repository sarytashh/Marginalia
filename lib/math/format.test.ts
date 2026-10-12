import { describe, expect, it } from "vitest";

import { parseMathText, type MathSegment } from "@/lib/math/format";

// Renders segments as x<2> so expectations stay readable.
function show(segments: MathSegment[]): string {
  return segments
    .map((segment) =>
      segment.kind === "text" ? segment.value : `<${show(segment.segments)}>`,
    )
    .join("");
}

const render = (text: string) => show(parseMathText(text));

describe("parseMathText", () => {
  it("raises simple and grouped exponents", () => {
    expect(render("x^2 + 8x + 16")).toBe("x<2> + 8x + 16");
    expect(render("3/2 x^(1/2) + 1/2 x^(-1/2)")).toBe("3/2 x<1/2> + 1/2 x<-1/2>");
    expect(render("e^{2x}")).toBe("e<2x>");
    expect(render("x^-1")).toBe("x<-1>");
  });

  it("keeps a sentence-ending dot outside the exponent", () => {
    expect(render("Factorize x^2 - 7x + 12.")).toBe("Factorize x<2> - 7x + 12.");
    expect(render("The result is x^2.")).toBe("The result is x<2>.");
  });

  it("handles nested exponents and plain text", () => {
    expect(render("e^(x^2)")).toBe("e<x<2>>");
    expect(render("No math here.")).toBe("No math here.");
    expect(render("A caret at the end ^")).toBe("A caret at the end ^");
  });

  it("shows typed operators as symbols", () => {
    expect(render("sqrt(x) * 3")).toBe("√(x)·3");
    expect(render("w^T x where x >= 0")).toBe("w<T> x where x ≥ 0");
  });
});
