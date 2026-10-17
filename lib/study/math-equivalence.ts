import { parse, type MathNode } from "mathjs";

// Small language models often mark a correct formula wrong when it is written
// differently from the reference, for example (3/2)√x + 1/(2√x) versus
// 3/2 x^(1/2) + 1/2 x^(-1/2). Equivalence is a question for arithmetic, not
// for a language model: evaluate both expressions at several points and
// compare.

const FUNCTION_NAMES = new Set(["sqrt", "sin", "cos", "tan", "log", "exp", "abs", "pi", "e"]);
const MAX_VARIABLES = 3;
const SAMPLE_POINTS = 8;
const MIN_VALID_POINTS = 5;
const RELATIVE_TOLERANCE = 1e-6;
const MAX_REFERENCE_PROSE_WORDS = 10;

function proseWordCount(text: string): number {
  return (text.replace(/sqrt|sin|cos|tan|log|exp|abs|pi/g, "").match(/[\p{L}]{3,}/gu) ?? []).length;
}

/** Rewrites common typed math into mathjs syntax. */
export function normalizeMathText(text: string): string {
  return text
    .replace(/[−–—]/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/π/g, "pi")
    .replace(/\bln\b/g, "log")
    .replace(/√\s*\(/g, "sqrt(")
    .replace(/√\s*([\p{L}\p{N}.]+)/gu, "sqrt($1)")
    // An ellipsis ("x1 + ... + xd") is not something that can be evaluated.
    // Keep it as one character so clause splitting on "." does not cut the
    // expression into fragments, and so the parser rejects it.
    .replace(/\.{3}/g, "…")
    .trim();
}

/**
 * The final result stated in an answer: the right-hand side of the last
 * equals sign in the last clause that holds a formula ("so dy/dx = ..."), or
 * the whole text when it is a bare expression. Null for prose. Only the final
 * result is compared, so an intermediate step cannot earn credit.
 */
export function finalMathResult(text: string): string | null {
  const normalized = normalizeMathText(text).replace(/\.$/, "");
  const clauses = normalized
    .split(/\.(?=\s|$)|;|\n|,\s+(?=[\p{L}])|\s+(?:and|or|so|which|because|gives|is)\s+/u)
    .map((clause) => clause.trim())
    .filter((clause) => clause !== "");

  for (let index = clauses.length - 1; index >= 0; index -= 1) {
    const parts = (clauses[index] ?? "").split("=");
    const result = parts[parts.length - 1]?.trim() ?? "";
    if (parseExpression(result) !== null) {
      return result;
    }
  }
  return null;
}

function parseExpression(text: string): MathNode | null {
  // A fragment such as "+ wd*xd + b" is part of a longer expression.
  if (/^[+*/^]|[+\-*/^]$/.test(text)) {
    return null;
  }
  if (text === "" || /[\p{L}]{3,}/u.test(text.replace(/sqrt|sin|cos|tan|log|exp|abs|pi/g, ""))) {
    // Prose (three or more letters in a row that are not a function name).
    return null;
  }

  try {
    const node = parse(text);
    if (variablesOf(node).size > MAX_VARIABLES) {
      return null;
    }
    return node;
  } catch {
    return null;
  }
}

function variablesOf(node: MathNode): Set<string> {
  const names = new Set<string>();
  node.traverse((child, _path, parent) => {
    if (child.type !== "SymbolNode") {
      return;
    }
    const name = (child as unknown as { name: string }).name;
    const isCallee =
      parent?.type === "FunctionNode" &&
      (parent as unknown as { fn: MathNode }).fn === child;
    if (!isCallee && !FUNCTION_NAMES.has(name)) {
      names.add(name);
    }
  });
  return names;
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((item) => b.has(item));
}

function evaluateAt(node: MathNode, scope: Record<string, number>): number | null {
  try {
    const value: unknown = node.evaluate(scope);
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/** Deterministic pseudo-random points in (0.5, 3.5), so results are repeatable. */
function samplePoints(variables: readonly string[]): Record<string, number>[] {
  let seed = 7;
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return 0.5 + (seed / 233280) * 3;
  };
  return Array.from({ length: SAMPLE_POINTS }, () =>
    Object.fromEntries(variables.map((name) => [name, next()])),
  );
}

export function areExpressionsEquivalent(left: string, right: string): boolean {
  const a = parseExpression(left);
  const b = parseExpression(right);
  if (a === null || b === null) {
    return false;
  }

  const variables = variablesOf(a);
  if (!sameSet(variables, variablesOf(b))) {
    return false;
  }

  let valid = 0;
  for (const scope of samplePoints([...variables])) {
    const x = evaluateAt(a, scope);
    const y = evaluateAt(b, scope);
    if (x === null || y === null) {
      continue;
    }
    const scale = Math.max(1, Math.abs(x), Math.abs(y));
    if (Math.abs(x - y) > RELATIVE_TOLERANCE * scale) {
      return false;
    }
    valid += 1;
  }

  return valid >= MIN_VALID_POINTS;
}

/**
 * The reference result the student's final result is equivalent to, or null
 * when either side is not a formula or they differ.
 */
export function findEquivalentReference(
  studentAnswer: string,
  referenceAnswer: string,
): string | null {
  const student = finalMathResult(studentAnswer);
  const reference = finalMathResult(referenceAnswer);
  if (student === null || reference === null) {
    return null;
  }
  // Only take the shortcut when the reference answer is essentially a
  // formula. When it also explains ideas in words, matching the formula is
  // not the whole answer, so the grader must judge it.
  if (proseWordCount(normalizeMathText(referenceAnswer).replace(reference, "")) > MAX_REFERENCE_PROSE_WORDS) {
    return null;
  }
  return areExpressionsEquivalent(student, reference) ? reference : null;
}
