import {
  MAX_TOPICS_PER_DOCUMENT,
  MIN_TOPICS_PER_DOCUMENT,
  TARGET_TOPICS_PER_DOCUMENT,
} from "@/lib/generation/limits";

export const TOPIC_EXTRACTION_SYSTEM_PROMPT = `You extract study topics from lecture passages.

Return only topics that are clearly present in the provided passages.
Do not use your own general knowledge.
Do not invent headings such as "Chapter 3", "Introduction", or "Summary".
Names must be specific to the material, like "Dijkstra's algorithm and priority queues", not "Graph theory".
Each summary is one sentence, grounded in the passages.

Return ${MIN_TOPICS_PER_DOCUMENT} to ${MAX_TOPICS_PER_DOCUMENT} topics, in the order they appear. Aim for about ${TARGET_TOPICS_PER_DOCUMENT} when the passages can support that many. Each name must be distinct. Cover different ideas from different passages — do not cluster everything under one heading.
Return fewer than ${MIN_TOPICS_PER_DOCUMENT} only if the passages truly cannot support that many distinct ideas. Do not pad by repeating or renaming the same idea.
If the passages cannot support a topic list, return an empty list.`;
