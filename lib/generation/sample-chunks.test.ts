import { describe, expect, it } from "vitest";

import { sampleRepresentativeChunks } from "@/lib/generation/sample-chunks";

function chunk(pageNumber: number, content: string) {
  return { pageNumber, content };
}

describe("sampleRepresentativeChunks", () => {
  it("returns an empty list for no chunks", () => {
    expect(sampleRepresentativeChunks([])).toEqual([]);
  });

  it("returns every chunk when the document is smaller than the cap", () => {
    const chunks = [chunk(2, "b"), chunk(1, "a"), chunk(3, "c")];
    expect(sampleRepresentativeChunks(chunks)).toEqual([
      chunk(1, "a"),
      chunk(2, "b"),
      chunk(3, "c"),
    ]);
  });

  it("keeps the first and last pages when downsampling", () => {
    const chunks = Array.from({ length: 10 }, (_, index) =>
      chunk(index + 1, `page ${index + 1}`),
    );

    const sampled = sampleRepresentativeChunks(chunks, 4);
    expect(sampled).toHaveLength(4);
    expect(sampled[0]).toEqual(chunk(1, "page 1"));
    expect(sampled[3]).toEqual(chunk(10, "page 10"));
  });

  it("spaces samples across the document instead of taking a prefix", () => {
    const chunks = Array.from({ length: 9 }, (_, index) =>
      chunk(index + 1, `page ${index + 1}`),
    );

    const sampled = sampleRepresentativeChunks(chunks, 3);
    expect(sampled.map((item) => item.pageNumber)).toEqual([1, 5, 9]);
  });

  it("returns a single chunk when the cap is 1", () => {
    const chunks = [chunk(1, "a"), chunk(2, "b")];
    expect(sampleRepresentativeChunks(chunks, 1)).toEqual([chunk(1, "a")]);
  });
});
