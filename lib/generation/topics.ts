import "server-only";

import { completeStructured } from "@/lib/ai/complete-structured";
import { TOPIC_EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/prompts/topics";
import {
  labelChunks,
  type LabelableChunk,
} from "@/lib/generation/ground";
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

  const result = await completeStructured({
    schema: topicExtractionSchema,
    system: TOPIC_EXTRACTION_SYSTEM_PROMPT,
    temperature: 0,
    user: `Document title: ${input.documentTitle}

Passages:
${passages}

Return JSON of this shape:
{"topics":[{"name":"Dijkstra's algorithm and priority queues","summary":"One sentence from the passages."}]}`,
  });

  return dedupeTopics(result.topics);
}

function dedupeTopics(topics: readonly ExtractedTopic[]): ExtractedTopic[] {
  const seen = new Set<string>();
  const unique: ExtractedTopic[] = [];

  for (const topic of topics) {
    const key = topic.name.trim().toLowerCase();
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
