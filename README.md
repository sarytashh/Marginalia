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

The Library, Study, and Progress routes are still placeholders. The data and model layers are in place:

- **Supabase.** Profiles, documents, 1024-dimension page chunks, topics, grounded questions (`source_chunk_ids`), attempts, and spaced-repetition `review_state`, with Row Level Security and a private `documents` storage bucket. Vector search uses the `match_chunks` RPC.
- **AI provider.** Chat and embeddings go through the official `openai` client pointed at whatever OpenAI-compatible endpoint you set. Helpers `embedTexts` (batches of 32, retries on 429/5xx) and `completeStructured` (Zod-validated JSON, one repair retry) live in `lib/ai/`. System prompts live in `lib/ai/prompts/` so they can be reviewed in git.

Environment variables (see `.env.example`; put real values only in `.env.local`):

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- AI: `AI_BASE_URL`, `AI_API_KEY`, `AI_CHAT_MODEL`, `AI_EMBEDDING_MODEL`, `AI_EMBEDDING_DIMENSIONS`

SiliconFlow values that work from mainland China: `AI_BASE_URL=https://api.siliconflow.cn/v1`, `AI_CHAT_MODEL=deepseek-ai/DeepSeek-V3`, `AI_EMBEDDING_MODEL=BAAI/bge-m3`, `AI_EMBEDDING_DIMENSIONS=1024`. After those are set, run `pnpm ai:check` to confirm both endpoints respond.

Apply `supabase/migrations/20260917100000_initial_schema.sql` once in the Supabase SQL Editor if you have not already.

---

Planning material for this project lives in [docs/plan.md](docs/plan.md) (the build guide) and
[docs/design.md](docs/design.md) (the design specification).
