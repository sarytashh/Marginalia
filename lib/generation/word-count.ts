export function countWords(chunks: readonly { content: string }[]): number {
  return chunks.reduce(
    (total, chunk) => total + (chunk.content.match(/[\p{L}\p{N}]+/gu)?.length ?? 0),
    0,
  );
}
