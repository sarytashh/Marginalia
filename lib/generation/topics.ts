import "server-only";

import { completeStructured } from "@/lib/ai/complete-structured";
import { TOPIC_EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/prompts/topics";
import { topicNameKey } from "@/lib/generation/dedupe";
import {
  labelChunks,
  type LabelableChunk,
} from "@/lib/generation/ground";
import {
  MAX_TOPICS_PER_DOCUMENT,
  MIN_TOPICS_PER_DOCUMENT,
  TARGET_TOPICS_PER_DOCUMENT,
} from "@/lib/generation/limits";
import { sampleRepresentativeChunks } from "@/lib/generation/sample-chunks";
import {
  topicExtractionSchema,
  type ExtractedTopic,
} from "@/lib/generation/schemas";

export async function extractTopicsFromChunks(input: {
  chunks: readonly LabelableChunk[];
  documentTitle: string;
}): Promise<ExtractedTopic[]> {
  const sampled = sampleRepresentativeChunks(input.chunks);
  if (sampled.length === 0) {
    return [];
  }

  const labeled = labelChunks(sampled);
  const passages = labeled
    .map(
      (chunk) =>
        `[${chunk.label} | page ${chunk.pageNumber}]\n${chunk.content}`,
    )
    .join("\n\n");

  const first = await requestTopics({
    documentTitle: input.documentTitle,
    passages,
    extraInstruction: null,
  });
  const topics = dedupeTopics(first).slice(0, MAX_TOPICS_PER_DOCUMENT);

  if (topics.length >= MIN_TOPICS_PER_DOCUMENT || topics.length === 0) {
    return topics;
  }

  const previousNames = topics.map((topic) => `- ${topic.name}`).join("\n");
  const second = await requestTopics({
    documentTitle: input.documentTitle,
    passages,
    extraInstruction: `You returned ${topics.length} topic(s). Return ${MIN_TOPICS_PER_DOCUMENT} to ${MAX_TOPICS_PER_DOCUMENT} distinct topics covering different ideas from different passages. Aim for about ${TARGET_TOPICS_PER_DOCUMENT}. Do not repeat or rename these topics:\n${previousNames}`,
  });

  return dedupeTopics([...topics, ...second]).slice(0, MAX_TOPICS_PER_DOCUMENT);
}

async function requestTopics(input: {
  documentTitle: string;
  extraInstruction: string | null;
  passages: string;
}): Promise<ExtractedTopic[]> {
  const extra =
    input.extraInstruction === null ? "" : `\n\n${input.extraInstruction}\n`;

  const result = await completeStructured({
    schema: topicExtractionSchema,
    system: TOPIC_EXTRACTION_SYSTEM_PROMPT,
    temperature: 0,
    user: `Document title: ${input.documentTitle}
${extra}
Return ${MIN_TOPICS_PER_DOCUMENT} to ${MAX_TOPICS_PER_DOCUMENT} distinct topics covering different ideas from these passages.

Passages:
${input.passages}

Return JSON of this shape:
{"topics":[{"name":"Dijkstra's algorithm and priority queues","summary":"One sentence from the passages."},{"name":"Bellman-Ford and negative weights","summary":"Another sentence from a different passage."}]}`,
  });

  return result.topics;
}

function dedupeTopics(topics: readonly ExtractedTopic[]): ExtractedTopic[] {
  const seen = new Set<string>();
  const unique: ExtractedTopic[] = [];

  for (const topic of topics) {
    const key = topicNameKey(topic.name);
    if (key === "" || seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push({
      name: topic.name.trim(),
      summary: topic.summary.trim(),
    });
  }

  return unique;
}
