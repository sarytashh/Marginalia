# Marginalia

An AI study tutor that turns your lecture slides into practice questions grounded in your own material, grades your written answers, and schedules what you should review next.

## Screenshots

_Coming soon._

## Live demo

_Coming soon._

## Stack

_Coming soon._

## Setup

_Coming soon._

## How it works

The Study and Progress routes are still placeholders. Upload, parsing, chunking, retrieval, topic extraction, and grounded question generation are in place.

- **Library.** Drop a text-based PDF (20 MB max) on `/`. The file is stored in the private `documents` bucket under the owner’s user id, a `documents` row is created with status `uploaded`, and a background job extracts text **per page** with `unpdf`, then chunks and embeds it. Page numbers stay on every chunk for later citations. Scanned image PDFs are rejected. After embedding, Marginalia extracts topics and writes questions. The row is polled so the processing steps update in place instead of showing a spinner. Until auth lands, uploads belong to `DEV_USER_ID` if set, otherwise a `local-dev@marginalia.invalid` auth user created via the service-role admin API. Use a small PDF (the `fixtures/sample-lecture.pdf` fixture, a few pages) on a local embedding box — skip huge textbooks.
- **Chunking and retrieval.** Pages are split to about 800 tokens with about 100 tokens of overlap, on paragraph and sentence boundaries, using `js-tiktoken` (`cl100k_base`). Chunks are embedded with `embedTexts` and stored on `chunks.embedding`. `searchChunks` embeds a query and calls the `match_chunks` RPC. A dev-only page at `/debug/search` shows retrieved passages and scores.
- **Topics and questions.** After the search index is ready, Marginalia samples passages across the document and asks the chat model for **5–12** specific topics (name + one-sentence summary). For each topic it retrieves the nearest chunks, then asks the model to write **4–8** questions using **only those passages**, mixed short answer with some multiple choice. Duplicate or near-duplicate prompts are dropped. The system prompt forbids using general knowledge; questions that cite unknown chunks are dropped before insert. Each question stores `source_chunk_ids` and a `review_state` row due immediately. Generation runs across topics with a concurrency limit of 2. To replace an existing topic/question set without re-embedding, `POST /api/documents/[id]/generate` with `{"replace":true}`.
- **Document detail.** `/documents/[id]` is the course-reader spread: title and metadata, the processing pipeline while work is in progress, a numbered topic index, and an expandable question archive. Each question shows its type, difficulty, source page, reference answer, and a passage excerpt. Primary action starts study for that material; Generate more writes another grounded batch; **Replace topics and questions** deletes the current set and extracts again from the existing search index (no re-embed).
- **Supabase.** Profiles, documents, 1024-dimension page chunks, topics, grounded questions (`source_chunk_ids`), attempts, and spaced-repetition `review_state`, with Row Level Security and a private `documents` storage bucket. Vector search uses the `match_chunks` RPC.
- **AI providers.** Chat and embeddings are separate OpenAI-compatible clients, so a chat-only host is not asked for vectors. `embedTexts` batches 32 inputs and retries 429/5xx; `completeStructured` validates JSON with Zod and retries once on a schema miss. System prompts live in `lib/ai/prompts/`.

Environment variables (see `.env.example`; put real values only in `.env.local`):

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Chat: `AI_CHAT_BASE_URL`, `AI_CHAT_API_KEY`, `AI_CHAT_MODEL`
- Embeddings: `AI_EMBEDDING_BASE_URL`, `AI_EMBEDDING_API_KEY`, `AI_EMBEDDING_MODEL`, `AI_EMBEDDING_DIMENSIONS`

This repo is currently run against local Ollama, not a cloud embedding host:

- Chat: `qwen2.5:14b` (`http://127.0.0.1:11434/v1`)
- Embeddings: `bge-m3` (`http://127.0.0.1:11434/v1`, 1024 dimensions). Install Ollama, run `ollama pull bge-m3` and `ollama pull qwen2.5:14b`, then set both `AI_*_API_KEY` values to any non-empty dummy such as `ollama`.

`pnpm ai:check` pings chat and embeddings independently and still prints both results if only one side fails.

Apply `supabase/migrations/20260917100000_initial_schema.sql` once in the Supabase SQL Editor if you have not already.

---

Planning material for this project lives in [docs/plan.md](docs/plan.md) (the build guide) and
[docs/design.md](docs/design.md) (the design specification).
