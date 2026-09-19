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

The Study and Progress routes are still placeholders. Upload, parsing, chunking, and retrieval are in place. Topics and questions are not generated yet.

- **Library.** Drop a text-based PDF (20 MB max) on `/`. The file is stored in the private `documents` bucket under the owner’s user id, a `documents` row is created with status `uploaded`, and a background job extracts text **per page** with `unpdf`, then chunks and embeds it. Page numbers stay on every chunk for later citations. Scanned image PDFs are rejected. After embedding, the row parks at `generating` so **Preparing search index** completes and later steps stay muted. The row is polled so the processing steps update in place instead of showing a spinner. Until auth lands, uploads belong to `DEV_USER_ID` if set, otherwise a `local-dev@marginalia.invalid` auth user created via the service-role admin API.
- **Chunking and retrieval.** Pages are split to about 800 tokens with about 100 tokens of overlap, on paragraph and sentence boundaries, using `js-tiktoken` (`cl100k_base`). Chunks are embedded with `embedTexts` and stored on `chunks.embedding`. `searchChunks` embeds a query and calls the `match_chunks` RPC. A dev-only page at `/debug/search` shows retrieved passages and scores. Skip huge PDFs (hundreds of pages) on a local embedding box.
- **Supabase.** Profiles, documents, 1024-dimension page chunks, topics, grounded questions (`source_chunk_ids`), attempts, and spaced-repetition `review_state`, with Row Level Security and a private `documents` storage bucket. Vector search uses the `match_chunks` RPC.
- **AI providers.** Chat and embeddings are separate OpenAI-compatible clients, so a chat-only host is not asked for vectors. `embedTexts` batches 32 inputs and retries 429/5xx; `completeStructured` validates JSON with Zod and retries once on a schema miss. System prompts live in `lib/ai/prompts/`.

Environment variables (see `.env.example`; put real values only in `.env.local`):

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Chat: `AI_CHAT_BASE_URL`, `AI_CHAT_API_KEY`, `AI_CHAT_MODEL`
- Embeddings: `AI_EMBEDDING_BASE_URL`, `AI_EMBEDDING_API_KEY`, `AI_EMBEDDING_MODEL`, `AI_EMBEDDING_DIMENSIONS`

This repo is currently run against local Ollama, not a cloud embedding host:

- Chat: `qwen2.5:3b` (`http://127.0.0.1:11434/v1`)
- Embeddings: `bge-m3` (`http://127.0.0.1:11434/v1`, 1024 dimensions). Install Ollama, run `ollama pull bge-m3` and `ollama pull qwen2.5:3b`, then set both `AI_*_API_KEY` values to any non-empty dummy such as `ollama`.

`pnpm ai:check` pings chat and embeddings independently and still prints both results if only one side fails.

Apply `supabase/migrations/20260917100000_initial_schema.sql` once in the Supabase SQL Editor if you have not already.

---

Planning material for this project lives in [docs/plan.md](docs/plan.md) (the build guide) and
[docs/design.md](docs/design.md) (the design specification).
