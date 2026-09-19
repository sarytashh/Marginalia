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

The Study and Progress routes are still placeholders. Upload and the data/model layers are in place:

- **Library.** Drop a text-based PDF (20 MB max) on `/`. The file is stored in the private `documents` bucket under the owner’s user id, a `documents` row is created with status `uploaded`, and a background job extracts text **per page** with `unpdf`. Page numbers are kept for later citations. Scanned image PDFs are rejected. The row is polled so the processing steps update in place instead of showing a spinner. Until auth lands, uploads belong to `DEV_USER_ID` if set, otherwise a `local-dev@marginalia.invalid` auth user created via the service-role admin API.
- **Supabase.** Profiles, documents, 1024-dimension page chunks, topics, grounded questions (`source_chunk_ids`), attempts, and spaced-repetition `review_state`, with Row Level Security and a private `documents` storage bucket. Vector search uses the `match_chunks` RPC.
- **AI providers.** Chat and embeddings are separate OpenAI-compatible clients, so a chat-only host such as DeepSeek is not asked for vectors. `embedTexts` batches 32 inputs and retries 429/5xx; `completeStructured` validates JSON with Zod and retries once on a schema miss. System prompts live in `lib/ai/prompts/`.

Environment variables (see `.env.example`; put real values only in `.env.local`):

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Chat: `AI_CHAT_BASE_URL`, `AI_CHAT_API_KEY`, `AI_CHAT_MODEL`
- Embeddings: `AI_EMBEDDING_BASE_URL`, `AI_EMBEDDING_API_KEY`, `AI_EMBEDDING_MODEL`, `AI_EMBEDDING_DIMENSIONS`

Recommended split for mainland China without a Chinese ID:

- Chat: DeepSeek (`https://api.deepseek.com/v1`, model `deepseek-chat`)
- Embeddings: local Ollama `bge-m3` (`http://127.0.0.1:11434/v1`, 1024 dimensions). Install Ollama, run `ollama pull bge-m3`, then set `AI_EMBEDDING_API_KEY` to any non-empty dummy such as `ollama`. Local embeddings avoid SiliconFlow/DashScope real-name signup.

`pnpm ai:check` pings chat and embeddings independently and still prints both results if only one side fails.

Apply `supabase/migrations/20260917100000_initial_schema.sql` once in the Supabase SQL Editor if you have not already.

---

Planning material for this project lives in [docs/plan.md](docs/plan.md) (the build guide) and
[docs/design.md](docs/design.md) (the design specification).
