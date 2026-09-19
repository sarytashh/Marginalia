export type SampleableChunk = {
  content: string;
  pageNumber: number;
};

export const DEFAULT_TOPIC_SAMPLE_SIZE = 12;

export function sampleRepresentativeChunks<T extends SampleableChunk>(
  chunks: readonly T[],
  maxChunks: number = DEFAULT_TOPIC_SAMPLE_SIZE,
): T[] {
  if (chunks.length === 0 || maxChunks < 1) {
    return [];
  }

  const sorted = [...chunks].sort(compareChunks);
  if (sorted.length <= maxChunks) {
    return sorted;
  }

  if (maxChunks === 1) {
    const first = sorted[0];
    return first === undefined ? [] : [first];
  }

  const lastIndex = sorted.length - 1;
  const indices = new Set<number>();
  for (let step = 0; step < maxChunks; step += 1) {
    indices.add(Math.round((step * lastIndex) / (maxChunks - 1)));
  }

  for (let index = 0; index < sorted.length && indices.size < maxChunks; index += 1) {
    indices.add(index);
  }

  return [...indices]
    .sort((left, right) => left - right)
    .flatMap((index) => {
      const chunk = sorted[index];
      return chunk === undefined ? [] : [chunk];
    });
}

function compareChunks(left: SampleableChunk, right: SampleableChunk): number {
  if (left.pageNumber !== right.pageNumber) {
    return left.pageNumber - right.pageNumber;
  }
  return left.content.localeCompare(right.content);
}
