const STRING_FIELD_PATTERN = (name: string) =>
  new RegExp(`"${escapeRegExp(name)}"\\s*:\\s*"`, "i");

export function extractJsonStringField(
  text: string,
  fieldNames: readonly string[],
): string | null {
  for (const name of fieldNames) {
    const extracted = extractNamedString(text, name);
    if (extracted !== null && extracted !== "") {
      return extracted;
    }
  }
  return null;
}

function extractNamedString(text: string, name: string): string | null {
  const match = STRING_FIELD_PATTERN(name).exec(text);
  if (match === null || match.index === undefined) {
    return null;
  }
  const start = match.index + match[0].length;
  return unescapePartialJsonString(text.slice(start));
}

export function unescapePartialJsonString(raw: string): string {
  let result = "";
  let index = 0;

  while (index < raw.length) {
    const char = raw[index];
    if (char === undefined) {
      break;
    }
    if (char === '"') {
      break;
    }
    if (char !== "\\") {
      result += char;
      index += 1;
      continue;
    }

    const next = raw[index + 1];
    if (next === undefined) {
      break;
    }
    if (next === "u") {
      const hex = raw.slice(index + 2, index + 6);
      if (hex.length < 4) {
        break;
      }
      const code = Number.parseInt(hex, 16);
      if (Number.isNaN(code)) {
        result += "u";
        index += 2;
        continue;
      }
      result += String.fromCharCode(code);
      index += 6;
      continue;
    }

    result += unescapeJsonChar(next);
    index += 2;
  }

  return result;
}

function unescapeJsonChar(char: string): string {
  switch (char) {
    case "n":
      return "\n";
    case "t":
      return "\t";
    case "r":
      return "\r";
    case "b":
      return "\b";
    case "f":
      return "\f";
    case '"':
    case "\\":
    case "/":
      return char;
    default:
      return char;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
