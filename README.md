# Marginalia

An AI study tutor that turns your lecture slides into practice questions grounded in the uploaded material, grades your written answers, and schedules what you should review next.

[![CI](https://github.com/sarytashh/Marginalia/actions/workflows/ci.yml/badge.svg)](https://github.com/sarytashh/Marginalia/actions/workflows/ci.yml)

## The problem

Lecture PDFs are easy to reread and hard to practice from. Generic quiz apps ask whatever the model already knows. Marginalia only writes and grades questions from retrieved passages of *your* slides, then uses spaced repetition so weak topics come back first.

## Stack

- **Next.js** App Router, TypeScript (strict), Tailwind CSS, shadcn/ui
- **Supabase** — Postgres, pgvector, Auth (email magic links), private Storage, Row Level Security
- **OpenAI-compatible AI clients** — chat and embeddings are separate env-configured endpoints. Local: Ollama (`qwen2.5:14b`, `bge-m3`). Hosted: Google Gemini (`gemini-3.5-flash-lite` chat, Gemini embeddings at 1024 dimensions).
- **Vitest** for pure logic: chunking, scheduling, grounding checks, retries

## How it works

1. **Upload.** A text-based PDF (20 MB max) is stored under your user id. Scanned image PDFs are rejected.
2. **Parse and chunk.** `unpdf` extracts text per page. Pages are split to about 800 tokens with about 100 tokens of overlap, on paragraph and sentence boundaries.
3. **Embed and retrieve.** Chunks are embedded and stored with page numbers. `searchChunks` embeds a query and calls the `match_chunks` RPC.
4. **Topics and questions.** The chat model proposes 5–12 topics from sampled passages. For each topic, nearby chunks are retrieved and the model writes 4–8 questions **using only those passages**. Each question stores `source_chunk_ids`. Unknown chunk ids and near-duplicates are dropped.
5. **Study.** `/study` presents one due question at a time, weakest topics first. Short answers are graded against the question, reference answer, and source chunks. Multiple choice is scored locally. Failed grading never clears the typed answer.
6. **Schedule.** A trimmed SM-2 `schedule` function in `lib/scheduler.ts` updates `review_state` after every attempt. `topicMastery` is a recency-weighted average and drives ordering.
7. **Progress.** `/progress` is an editorial report: weakest topics first, a 12-week activity heatmap, score over time, and streak copy that does not treat a miss as failure.

## An interesting decision

The grounding rule is the product. The model is not allowed to draw on general knowledge when writing questions or grading. System prompts live in `lib/ai/prompts/` so they can be reviewed in git. Raw model JSON never reaches the database: `completeStructured` validates every response with Zod and retries once on a schema miss. A question that cites a chunk id that was not retrieved is discarded before insert.

The same idea shows up in the provider layer. Chat and embeddings are separate OpenAI-compatible clients configured only through environment variables, so a chat-only host is never asked for vectors, and the app can move between local Ollama and hosted Gemini without code changes.

## Testing

215 Vitest tests cover the pure logic: chunking, the SM-2 scheduler, topic mastery, grounding checks, JSON parsing, retries, and auth redirects. `pnpm rls:check` creates two throwaway users against a real Supabase project and confirms neither can read the other's data. CI runs typecheck, lint, and tests on every push.

## Running it

You need a Supabase project, Node 22, pnpm, and either Ollama (local) or a Gemini API key from Google AI Studio (hosted). Full steps, environment variables, and hosting notes are in [docs/setup.md](docs/setup.md).

```bash
pnpm install
pnpm dev   # http://localhost:4317
```
