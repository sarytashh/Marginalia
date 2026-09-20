# Marginalia

An AI study tutor that turns your lecture slides into practice questions grounded in the uploaded material, grades your written answers, and schedules what you should review next.

[![CI](https://github.com/sarytashh/Marginalia/actions/workflows/ci.yml/badge.svg)](https://github.com/sarytashh/Marginalia/actions/workflows/ci.yml)

![Study session with in-place grading feedback](docs/screenshots/study-feedback.png)

_Study — one question, a written answer, and feedback that stays beside the source passage. Capture this screen after submitting an answer so the verdict and explanation are visible._

## Live demo

A public URL is not up yet — production hosting is wired in the repo and waiting on provider keys plus a Zeabur project. Local development runs at [http://localhost:4317](http://localhost:4317).

## The problem

Lecture PDFs are easy to reread and hard to practice from. Generic quiz apps ask whatever the model already knows. Marginalia only writes and grades questions from retrieved passages of *your* slides, then uses spaced repetition so weak topics come back first.

## Stack

- **Next.js** App Router, TypeScript (strict), Tailwind CSS, shadcn/ui
- **Supabase** — Postgres, pgvector, Auth (email magic links), private Storage, Row Level Security
- **OpenAI-compatible AI clients** — chat and embeddings are separate env-configured endpoints. Local: Ollama (`qwen2.5:14b`, `bge-m3`). Production: DeepSeek chat + Jina embeddings.
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

The same idea shows up in the provider layer. Chat and embeddings are separate OpenAI-compatible clients configured only through environment variables, so a chat-only host is never asked for vectors, and the app can move between local Ollama and production DeepSeek + Jina without code changes.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values (never commit `.env.local`).
2. Apply every file in `supabase/migrations/` once, in filename order, via the Supabase SQL Editor (New query → paste → Run). The first file creates the schema; later files add `progress_dashboard` and the Auth profile trigger.
3. In the Supabase dashboard, point confirm/magic-link emails at this app (port **4317** locally, not 3000):
   - **Authentication → URL Configuration → Site URL:** `http://localhost:4317` → Save. After the live domain exists, you can change this to that origin; keep the local URLs in Redirect URLs.
   - **Redirect URLs → Add URL** (add each, then Save):
     - `http://localhost:4317/auth/callback`
     - `http://localhost:4317/auth/confirm`
     - `http://127.0.0.1:4317/auth/callback`
     - `http://127.0.0.1:4317/auth/confirm`
     - After deploy, also add `https://YOUR_DOMAIN/auth/callback` and `https://YOUR_DOMAIN/auth/confirm`
   - **Authentication → Providers → Email:** enable Email. Leave magic links on.
   - **Authentication → Email Templates → Confirm signup:** set the button/link `href` to
     `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=signup`
   - **Authentication → Email Templates → Magic Link:**
     `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=magiclink`
     Do not use `{{ .ConfirmationURL }}` — that link often goes to `localhost:3000` or `supabase.co`.
     `RedirectTo` is the origin the user signed in from, so local and production can share one project.
4. Install Ollama, then `ollama pull bge-m3` and `ollama pull qwen2.5:14b`.
5. `pnpm install` and `pnpm dev` (port **4317**).
6. Open `http://localhost:4317` on this computer. Enter your email **once**, then open the **new** message on this computer, in the same browser. Hover Confirm: it must start with `http://localhost:4317/auth/callback`. Old emails stay on the old URL. Built-in Supabase email allows about **two sign-in messages per hour** — if the app says an hour, open the last email instead of pressing Retry.

`pnpm ai:check` pings chat and embeddings independently and still prints both results if only one side fails. `pnpm rls:check` creates two throwaway Auth users and confirms neither can read the other's documents, chunks, questions, or attempts. `pnpm typecheck`, `pnpm lint`, and `pnpm test` are what CI runs. `pnpm build` is the production compile.

Environment variables (see `.env.example`; put real values only in `.env.local` or the host dashboard — never in git):

| Variable | Local | Production |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project URL | Same |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key | Same |
| `AI_CHAT_BASE_URL` | `http://127.0.0.1:11434/v1` | `https://api.deepseek.com/v1` |
| `AI_CHAT_API_KEY` | `ollama` | DeepSeek key from [platform.deepseek.com](https://platform.deepseek.com) |
| `AI_CHAT_MODEL` | `qwen2.5:14b` | `deepseek-flash` |
| `AI_CHAT_THINKING` | leave unset | leave unset (DeepSeek thinking is disabled automatically) |
| `AI_EMBEDDING_BASE_URL` | `http://127.0.0.1:11434/v1` | `https://api.jina.ai/v1` |
| `AI_EMBEDDING_API_KEY` | `ollama` | Jina key from [jina.ai](https://jina.ai) |
| `AI_EMBEDDING_MODEL` | `bge-m3` | `jina-embeddings-v3` |
| `AI_EMBEDDING_DIMENSIONS` | `1024` | `1024` |
| `NEXT_PUBLIC_SITE_URL` | optional; defaults to `http://localhost:4317` | the public origin, e.g. `https://your-service.zeabur.app` |

Production cannot use Ollama. Chat and embeddings are called from the host, not the browser, so a Hong Kong or Singapore server can reach DeepSeek and Jina even when a campus network cannot. SiliconFlow is not used: it requires mainland-China KYC.

Jina `jina-embeddings-v3` is a different vector space from local `bge-m3`. Re-upload PDFs on the live app (or use Novita `baai/bge-m3` at `https://api.novita.ai/v3/openai` if this Supabase already holds Ollama vectors and you need them to stay searchable). Do not mix embedding models in one database.

### Production hosting

`*.vercel.app` is often blocked on mainland campus networks. A custom domain in front of Vercel (even with Cloudflare orange-cloud) still terminates on Vercel’s US/EU IPs, and Cloudflare itself is frequently slow or blocked on CERNET. Vercel Hobby also caps serverless duration; this app’s PDF pipeline uses `after()` and can run for minutes.

**Zeabur (Hong Kong or Singapore shared cluster)** is the host for the live demo. It runs Next.js as a persistent Node server (`PORT` is honoured by `pnpm start`), so question generation is not killed at 10s/60s, and HK/SG routing is the more realistic path for classmates on campus *and* recruiters abroad. A free `*.zeabur.app` URL is enough to try; buy a domain only if that subdomain is blocked on campus. Mainland-China Zeabur regions need ICP 备案 and Chinese real-name verification — skip those.

`/debug` and `/api/debug` return 404 in production.

## Screenshots

Export these three screens at **1440px wide** (and `/study` also at **375px** if you can). Save them under `docs/screenshots/` with the filenames below, then the images in this README will render.

1. **`docs/screenshots/study-feedback.png`** — `/study` after grading. The serif question stays on screen; the verdict word and explanation sit underneath; the source excerpt is visible. This is the hero image at the top.
2. **`docs/screenshots/library.png`** — `/` with at least one document in the list. The editorial heading (due questions or “caught up”), the materials rows, and the ivory/ink/burgundy palette should be obvious. No generic card grid.
3. **`docs/screenshots/progress.png`** — `/progress` after a few attempts. Weakest topics first, mastery line with a text state, heatmap, and score chart on the canvas — not boxed dashboard cards.

![Library](docs/screenshots/library.png)

![Progress](docs/screenshots/progress.png)

---

Planning material lives in [docs/plan.md](docs/plan.md) and [docs/design.md](docs/design.md).
