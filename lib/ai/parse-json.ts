export function parseModelJson(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed === "") {
    throw new Error("Empty JSON");
  }

  const candidates = [stripMarkdownFence(trimmed), extractJsonSpan(trimmed)];
  let lastError: unknown;

  for (const candidate of candidates) {
    if (candidate === null || candidate === "") {
      continue;
    }
    try {
      return JSON.parse(candidate) as unknown;
    } catch (error) {
      lastError = error;
    }
  }

  const detail = lastError instanceof Error ? lastError.message : "Invalid JSON";
  throw new Error(detail);
}

function stripMarkdownFence(text: string): string {
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text);
  if (match?.[1] === undefined) {
    return text;
  }
  return match[1].trim();
}

function extractJsonSpan(text: string): string | null {
  const objectStart = text.indexOf("{");
  const arrayStart = text.indexOf("[");
  const start =
    objectStart === -1
      ? arrayStart
      : arrayStart === -1
        ? objectStart
        : Math.min(objectStart, arrayStart);
  if (start === -1) {
    return null;
  }

  const opener = text[start];
  const closer = opener === "[" ? "]" : "}";
  const end = text.lastIndexOf(closer);
  if (end <= start) {
    return null;
  }

  return text.slice(start, end + 1);
}
