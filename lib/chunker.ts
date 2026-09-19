import { getEncoding } from "js-tiktoken";

import type { ExtractedPage } from "@/lib/pdf/types";

export const CHUNK_TOKEN_TARGET = 800;
export const CHUNK_TOKEN_OVERLAP = 100;

export type SourceChunk = {
  content: string;
  pageNumber: number;
  tokenCount: number;
};

const encoding = getEncoding("cl100k_base");

export function countTokens(text: string): number {
  if (text === "") {
    return 0;
  }
  return encoding.encode(text).length;
}

export function chunkPages(pages: readonly ExtractedPage[]): SourceChunk[] {
  return pages.flatMap(chunkPage);
}

function chunkPage(page: ExtractedPage): SourceChunk[] {
  const text = page.content.trim();
  if (text === "") {
    return [];
  }

  if (countTokens(text) <= CHUNK_TOKEN_TARGET) {
    return [
      {
        content: text,
        pageNumber: page.pageNumber,
        tokenCount: countTokens(text),
      },
    ];
  }

  return packUnits(splitToFit(text, CHUNK_TOKEN_TARGET), page.pageNumber);
}

function splitToFit(text: string, maxTokens: number): string[] {
  const trimmed = text.trim();
  if (trimmed === "") {
    return [];
  }
  if (countTokens(trimmed) <= maxTokens) {
    return [trimmed];
  }

  const paragraphs = splitOn(/(\n{2,})/, trimmed);
  if (paragraphs.length > 1) {
    return paragraphs.flatMap((paragraph) => splitToFit(paragraph, maxTokens));
  }

  const lines = splitOn(/(\n)/, trimmed);
  if (lines.length > 1) {
    return lines.flatMap((line) => splitToFit(line, maxTokens));
  }

  const sentences = splitSentences(trimmed);
  if (sentences.length > 1) {
    return sentences.flatMap((sentence) => splitToFit(sentence, maxTokens));
  }

  return slidingTokenWindows(trimmed, maxTokens, CHUNK_TOKEN_OVERLAP);
}

function packUnits(units: string[], pageNumber: number): SourceChunk[] {
  const chunks: SourceChunk[] = [];
  let buffer: string[] = [];
  let bufferIsOverlap = false;

  const bufferText = (): string => buffer.join("\n\n");

  const emit = (content: string): void => {
    const trimmed = content.trim();
    if (trimmed === "") {
      return;
    }
    chunks.push({
      content: trimmed,
      pageNumber,
      tokenCount: countTokens(trimmed),
    });
  };

  for (const unit of units) {
    if (buffer.length === 0) {
      buffer = [unit];
      bufferIsOverlap = false;
      continue;
    }

    const candidate = `${bufferText()}\n\n${unit}`;
    if (countTokens(candidate) <= CHUNK_TOKEN_TARGET) {
      buffer.push(unit);
      bufferIsOverlap = false;
      continue;
    }

    if (!bufferIsOverlap) {
      emit(bufferText());
    }

    const previous = bufferIsOverlap ? "" : bufferText();
    const overlap = previous === "" ? "" : takeLastTokens(previous, CHUNK_TOKEN_OVERLAP);
    const withOverlap = overlap === "" ? unit : `${overlap}\n\n${unit}`;

    if (overlap !== "" && countTokens(withOverlap) <= CHUNK_TOKEN_TARGET) {
      buffer = [overlap, unit];
      bufferIsOverlap = false;
    } else {
      buffer = [unit];
      bufferIsOverlap = false;
    }
  }

  if (!bufferIsOverlap) {
    emit(bufferText());
  }

  return chunks;
}

function slidingTokenWindows(
  text: string,
  maxTokens: number,
  overlapTokens: number,
): string[] {
  const tokens = encoding.encode(text);
  if (tokens.length <= maxTokens) {
    return [text];
  }

  const windows: string[] = [];
  let start = 0;

  while (start < tokens.length) {
    const end = Math.min(start + maxTokens, tokens.length);
    windows.push(encoding.decode(tokens.slice(start, end)));
    if (end === tokens.length) {
      break;
    }
    const nextStart = end - overlapTokens;
    start = nextStart > start ? nextStart : end;
  }

  return windows.filter((window) => window !== "");
}

function takeLastTokens(text: string, tokenCount: number): string {
  if (tokenCount <= 0) {
    return "";
  }
  const tokens = encoding.encode(text);
  if (tokens.length <= tokenCount) {
    return text.trim();
  }
  return encoding.decode(tokens.slice(-tokenCount)).trim();
}

function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?。！？])\s+/).map((part) => part.trim());
  return parts.filter((part) => part !== "");
}

function splitOn(pattern: RegExp, text: string): string[] {
  return text
    .split(pattern)
    .map((part) => part.trim())
    .filter((part) => part !== "" && !/^\n+$/.test(part));
}
