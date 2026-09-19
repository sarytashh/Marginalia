import { describe, expect, it } from "vitest";

import {
  CHUNK_TOKEN_OVERLAP,
  CHUNK_TOKEN_TARGET,
  chunkPages,
  countTokens,
} from "@/lib/chunker";

function overlappingTokenCount(left: string, right: string): number {
  let size = Math.min(left.length, right.length);
  while (size > 0 && left.slice(-size) !== right.slice(0, size)) {
    size -= 1;
  }
  return size === 0 ? 0 : countTokens(left.slice(-size));
}

function sentence(index: number): string {
  return `Graph search claim ${index} explains vertices, edges, and a priority queue used by Dijkstra.`;
}

function fillSentences(minTokens: number): string {
  const parts: string[] = [];
  let text = "";
  let index = 1;
  while (countTokens(text) < minTokens) {
    parts.push(sentence(index));
    index += 1;
    text = parts.join(" ");
  }
  return text;
}

function fillToTokens(minTokens: number, glue: string): string {
  const parts: string[] = [];
  let text = "";
  let n = 1;
  while (countTokens(text) < minTokens) {
    parts.push(`${glue}${n}`);
    n += 1;
    text = parts.join(" ");
  }
  return text;
}

describe("chunkPages", () => {
  it("keeps page numbers and does not merge pages", () => {
    const chunks = chunkPages([
      { pageNumber: 1, content: "A graph has vertices and edges." },
      { pageNumber: 2, content: "Dijkstra uses a priority queue." },
      { pageNumber: 3, content: "" },
    ]);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.pageNumber).toBe(1);
    expect(chunks[1]?.pageNumber).toBe(2);
    expect(chunks[0]?.content).toContain("vertices");
    expect(chunks[1]?.content).toContain("priority queue");
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBe(countTokens(chunk.content));
      expect(chunk.tokenCount).toBeLessThanOrEqual(CHUNK_TOKEN_TARGET);
    }
  });

  it("splits on sentence boundaries with about 100 tokens of overlap", () => {
    const page = fillSentences(CHUNK_TOKEN_TARGET + CHUNK_TOKEN_OVERLAP + 50);
    expect(countTokens(page)).toBeGreaterThan(CHUNK_TOKEN_TARGET);

    const chunks = chunkPages([{ pageNumber: 4, content: page }]);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.pageNumber).toBe(4);
      expect(chunk.tokenCount).toBeLessThanOrEqual(CHUNK_TOKEN_TARGET);
      expect(chunk.content.trimEnd()).toMatch(/[.!?]$/);
    }

    const first = chunks[0];
    const second = chunks[1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (first === undefined || second === undefined) {
      return;
    }

    const overlap = overlappingTokenCount(first.content, second.content);
    expect(overlap).toBeGreaterThanOrEqual(CHUNK_TOKEN_OVERLAP - 15);
    expect(overlap).toBeLessThanOrEqual(CHUNK_TOKEN_OVERLAP + 15);
  });

  it("splits a single very long paragraph without exceeding the token limit", () => {
    const paragraph = fillToTokens(CHUNK_TOKEN_TARGET * 2 + 50, "algorithm");
    expect(paragraph.includes("\n")).toBe(false);
    expect(paragraph.includes(".")).toBe(false);

    const chunks = chunkPages([{ pageNumber: 9, content: paragraph }]);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.pageNumber).toBe(9);
      expect(chunk.tokenCount).toBeLessThanOrEqual(CHUNK_TOKEN_TARGET);
      expect(chunk.tokenCount).toBeGreaterThan(0);
    }

    const first = chunks[0];
    const second = chunks[1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (first === undefined || second === undefined) {
      return;
    }

    const overlap = overlappingTokenCount(first.content, second.content);
    expect(overlap).toBeGreaterThanOrEqual(CHUNK_TOKEN_OVERLAP - 5);
    expect(overlap).toBeLessThanOrEqual(CHUNK_TOKEN_OVERLAP);
    expect(chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0)).toBeGreaterThan(
      countTokens(paragraph),
    );
  });
});
