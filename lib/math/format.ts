// Questions, answers and feedback are plain text written by the model, with
// math typed the way people type it: x^2, x^(1/2), sqrt(x), 3*x. This splits
// such text into plain and superscript runs so it can be shown as x², x½
// and √x without asking a small model to produce valid LaTeX.

export type MathSegment =
  | { kind: "text"; value: string }
  | { kind: "sup"; segments: MathSegment[] };

const BARE_EXPONENT = /^[-+−]?[\p{L}\p{N}.]+/u;

function readGroup(text: string, start: number, open: string, close: string): number | null {
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return null;
}

/** Readable symbols for typed operators outside exponents. */
export function prettifyOperators(text: string): string {
  return text
    .replace(/\bsqrt\s*\(/g, "√(")
    .replace(/(\S)\s*\*\s*(\S)/g, "$1·$2")
    .replace(/<=/g, "≤")
    .replace(/>=/g, "≥")
    .replace(/!=/g, "≠");
}

export function parseMathText(text: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let buffer = "";
  let index = 0;

  const flush = () => {
    if (buffer !== "") {
      segments.push({ kind: "text", value: prettifyOperators(buffer) });
      buffer = "";
    }
  };

  while (index < text.length) {
    const char = text[index];
    if (char !== "^" || index + 1 >= text.length) {
      buffer += char;
      index += 1;
      continue;
    }

    const next = text[index + 1];
    let exponent: string | null = null;
    let end = index + 1;

    if (next === "(" || next === "{") {
      const close = readGroup(text, index + 1, next, next === "(" ? ")" : "}");
      if (close !== null) {
        exponent = text.slice(index + 2, close);
        end = close + 1;
      }
    } else {
      const match = BARE_EXPONENT.exec(text.slice(index + 1));
      if (match !== null) {
        // "x^2." ends the sentence; the trailing dot is not part of the exponent.
        const value = match[0].replace(/\.+$/, "");
        if (value !== "") {
          exponent = value;
          end = index + 1 + value.length;
        }
      }
    }

    if (exponent === null || exponent.trim() === "") {
      buffer += char;
      index += 1;
      continue;
    }

    flush();
    segments.push({ kind: "sup", segments: parseMathText(exponent) });
    index = end;
  }

  flush();
  return segments;
}
