// Each topic retrieves passages by similarity to its name and summary. In a
// short lecture the retrieval limit can exceed the number of chunks, so every
// topic would receive the whole document and its questions drift into other
// topics. Keep only passages close to the best match.

export const TOPIC_PASSAGE_MARGIN = 0.08;
export const MIN_TOPIC_PASSAGES = 2;

export function selectTopicPassages<T extends { similarity: number }>(
  passages: readonly T[],
  options: { margin?: number; minimum?: number } = {},
): T[] {
  const margin = options.margin ?? TOPIC_PASSAGE_MARGIN;
  const minimum = options.minimum ?? MIN_TOPIC_PASSAGES;
  const ranked = [...passages].sort((a, b) => b.similarity - a.similarity);
  const best = ranked[0];
  if (best === undefined) {
    return [];
  }

  return ranked.filter(
    (passage, index) => index < minimum || passage.similarity >= best.similarity - margin,
  );
}
