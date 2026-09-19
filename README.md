# Marginalia

An AI study tutor that turns your lecture slides into practice questions grounded in the uploaded material, grades your written answers, and schedules what you should review next.

[![CI](https://github.com/sarytashh/Marginalia/actions/workflows/ci.yml/badge.svg)](https://github.com/sarytashh/Marginalia/actions/workflows/ci.yml)

![Study session with in-place grading feedback](docs/screenshots/study-feedback.png)

_Study — one question, a written answer, and feedback that stays beside the source passage. Capture this screen after submitting an answer so the verdict and explanation are visible._

## Live demo

A public URL is not up yet. Local development runs at [http://localhost:4317](http://localhost:4317).

## The problem

Lecture PDFs are easy to reread and hard to practice from. Generic quiz apps ask whatever the model already knows. Marginalia only writes and grades questions from retrieved passages of *your* slides, then uses spaced repetition so weak topics come back first.

## Stack

- **Next.js** App Router, TypeScript (strict), Tailwind CSS, shadcn/ui
- **Supabase** — Postgres, pgvector, Auth (email magic links), private Storage, Row Level Security
- **OpenAI-compatible AI clients** — chat and embeddings are separate env-configured endpoints. This repo is run against local Ollama (`qwen2.5:14b` for chat, `bge-m3` for embeddings)
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

The same idea shows up in the provider layer. Chat and embeddings are separate OpenAI-compatible clients configured only through environment variables, so a chat-only host is never asked for vectors, and the app can move between Ollama, SiliconFlow, or another compatible endpoint without code changes.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values (never commit `.env.local`).
2. Apply every file in `supabase/migrations/` once, in filename order, via the Supabase SQL Editor (New query → paste → Run). The first file creates the schema; later files add `progress_dashboard` and the Auth profile trigger.
3. In the Supabase dashboard, point confirm/magic-link emails at this app (port **4317**, not 3000):
   - **Authentication → URL Configuration → Site URL:** `http://localhost:4317/auth/callback` → Save
   - **Redirect URLs → Add URL** (add each, then Save):
     - `http://localhost:4317/auth/callback`
     - `http://localhost:4317/auth/confirm`
     - `http://127.0.0.1:4317/auth/callback`
     - `http://127.0.0.1:4317/auth/confirm`
   - **Authentication → Providers → Email:** enable Email. Leave magic links on.
   - **Authentication → Email Templates → Confirm signup:** set the button/link `href` to
     `{{ .SiteURL }}?token_hash={{ .TokenHash }}&type=signup`
   - **Authentication → Email Templates → Magic Link:**
     `{{ .SiteURL }}?token_hash={{ .TokenHash }}&type=magiclink`
     Do not use `{{ .ConfirmationURL }}` — that link often goes to `localhost:3000` or `supabase.co`.
4. Install Ollama, then `ollama pull bge-m3` and `ollama pull qwen2.5:14b`.
5. `pnpm install` and `pnpm dev` (port **4317**).
6. Open `http://localhost:4317` on this computer. Enter your email **once**, then open the **new** message on this computer, in the same browser. Hover Confirm: it must start with `http://localhost:4317/auth/callback`. Old emails stay on the old URL. Built-in Supabase email allows about **two sign-in messages per hour** — if the app says an hour, open the last email instead of pressing Retry.

`pnpm ai:check` pings chat and embeddings independently and still prints both results if only one side fails. `pnpm rls:check` creates two throwaway Auth users and confirms neither can read the other's documents, chunks, questions, or attempts. `pnpm typecheck`, `pnpm lint`, and `pnpm test` are what CI runs.

Environment variables (see `.env.example`; put real values only in `.env.local`):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key |
| `AI_CHAT_BASE_URL` | OpenAI-compatible chat endpoint |
| `AI_CHAT_API_KEY` | Chat API key (any non-empty dummy such as `ollama` for local Ollama) |
| `AI_CHAT_MODEL` | Chat model name |
| `AI_EMBEDDING_BASE_URL` | OpenAI-compatible embeddings endpoint |
| `AI_EMBEDDING_API_KEY` | Embeddings API key |
| `AI_EMBEDDING_MODEL` | Embedding model name |
| `AI_EMBEDDING_DIMENSIONS` | Vector size (1024 for `bge-m3`) |
| `NEXT_PUBLIC_SITE_URL` | Optional. Canonical origin for Open Graph links; defaults to `http://localhost:4317` |

This repo is currently run against local Ollama:

- Chat: `qwen2.5:14b` at `http://127.0.0.1:11434/v1`
- Embeddings: `bge-m3` at `http://127.0.0.1:11434/v1`, 1024 dimensions

## Screenshots

Export these three screens at **1440px wide** (and `/study` also at **375px** if you can). Save them under `docs/screenshots/` with the filenames below, then the images in this README will render.

1. **`docs/screenshots/study-feedback.png`** — `/study` after grading. The serif question stays on screen; the verdict word and explanation sit underneath; the source excerpt is visible. This is the hero image at the top.
2. **`docs/screenshots/library.png`** — `/` with at least one document in the list. The editorial heading (due questions or “caught up”), the materials rows, and the ivory/ink/burgundy palette should be obvious. No generic card grid.
3. **`docs/screenshots/progress.png`** — `/progress` after a few attempts. Weakest topics first, mastery line with a text state, heatmap, and score chart on the canvas — not boxed dashboard cards.

![Library](docs/screenshots/library.png)

![Progress](docs/screenshots/progress.png)

---

Planning material lives in [docs/plan.md](docs/plan.md) and [docs/design.md](docs/design.md).
