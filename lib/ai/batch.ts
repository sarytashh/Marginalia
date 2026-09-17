export const EMBEDDING_BATCH_SIZE = 32;

export function batchItems<T>(
  items: readonly T[],
  batchSize: number = EMBEDDING_BATCH_SIZE,
): T[][] {
  if (batchSize < 1) {
    throw new Error("batchSize must be at least 1.");
  }

  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }
  return batches;
}
