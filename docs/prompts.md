# Marginalia — prompts to build it

Paste these into a fresh Cursor chat, **in order**, one at a time. Each one is self-contained, so the
new chat doesn't need to know anything about the conversation that produced this document.

## How to use these well

- **One prompt per step. Wait for it to finish, then actually use the app before moving on.** The
  whole value of building it yourself is catching the things that feel wrong, and you can only feel
  them by clicking around.
- **Use Agent mode**, and let it run commands. It needs to install packages, run migrations, and
  push to git.
- **Attach the design spec.** Before Prompt 1, copy [design.md](design.md) into the new project as
  `docs/design.md`. It is the single source of truth for every visual and interaction decision.
  Reference it with `@docs/design.md` whenever you build or revise a screen.
- **Don't paste your API keys into chat.** Put them in `.env.local` yourself. The prompts tell the
  agent to expect them there.
- **When something's wrong, describe the symptom, not your guess at the cause.** "The mastery bar
  shows 0% even after I answered three questions correctly" gets a better fix than "I think the
  mastery calculation is broken, change it to average recent scores."
- **After each prompt, confirm it committed and pushed.** If it didn't, say: "Commit this with a
  descriptive message and push to the branch."

---

## Prompt 0 — repo, GitHub, and ground rules

Do this first. It sets up the repository and the rules the agent follows for the rest of the build.

> I'm starting a new project called **Marginalia** — an AI study tutor. I upload my lecture slides as
> PDFs, and it generates practice questions from my material, grades my written answers, and uses
> spaced repetition to decide what I should review next. I'm a first-year CS student and this is a
> portfolio project, so I care about the code and the git history being something I'd be happy to
> show an interviewer.
>
> Before writing any application code, set up the foundation:
>
> 1. Initialize a git repository if there isn't one, on a branch called `main`.
> 2. Create a `.gitignore` for a Node/Next.js project. It must ignore `.env*.local`, `node_modules`,
>    `.next`, and `.DS_Store`. Never commit a file containing real secrets.
> 3. Create a `README.md` with the project name, a one-sentence description, and placeholder sections
>    for Screenshots, Live demo, Stack, Setup, and How it works. We'll fill these in as we go.
> 4. Create `.cursor/rules/project.mdc` containing the project rules I'll paste in a moment as a
>    follow-up message — for now just create the file with a heading.
> 5. Make the first commit, and tell me the exact commands I need to run to connect this to a new
>    GitHub repository and push, assuming I've created an empty repo on GitHub named `Marginalia`. Also
>    tell me whether the GitHub CLI (`gh`) is available here, and if so, offer to create the repo for
>    me directly.
>
> For the rest of this project, follow these git practices without me having to ask:
> commit after each logical, working change with a descriptive message in imperative mood
> ("Add PDF text extraction", not "added stuff"); never bundle unrelated changes into one commit;
> push after each commit; never force-push or amend.
>
> Don't scaffold the Next.js app yet — I'll ask for that next.

Then immediately send the contents of [cursor-rules.md](cursor-rules.md) as a follow-up message,
prefaced with: "Put this in `.cursor/rules/project.mdc` and follow it for the rest of the project."

---

## Prompt 1 — scaffold and design system

> Scaffold the Marginalia app. Marginalia is an AI study tutor: upload lecture-slide PDFs, get practice
> questions generated from that material, answer them in free text, get graded, and have weak topics
> resurface via spaced repetition.
>
> Before designing anything, read `@docs/design.md` in full. It defines the chosen Editorial Academic
> direction and is the single source of truth for visual design, interactions, states, copy, and
> responsive behavior. Follow it rather than shadcn defaults. If another instruction conflicts with
> it on design, `@docs/design.md` wins.
>
> Stack — use exactly this:
>
> - Next.js with the App Router and TypeScript, in strict mode
> - Tailwind CSS
> - shadcn/ui for component primitives — initialize it and add button, card, dialog, input, textarea,
>   label, progress, badge, skeleton, sonner, dropdown-menu, and tabs
> - `next-themes` for dark mode
> - pnpm as the package manager
>
> Scaffold into a temporary subdirectory and then move the files to the repository root, because
> `create-next-app` refuses to target the root directory directly.
>
> Then build the design system and app shell, but no features yet:
>
> - Set up the two-family typography and Editorial Academic color system specified in
>   `@docs/design.md`: an editorial serif for content, Geist Sans for interface text, warm ivory
>   surfaces, deep ink text, muted burgundy actions, hairline rules, and accessible semantic colors.
>   Implement both light and dark themes. Do not substitute a blue or purple SaaS palette.
> - Build the app shell: a header with the app name, a theme toggle, and navigation to Library (`/`),
>   Study (`/study`), and Progress (`/progress`). On mobile this becomes a bottom navigation bar with
>   three items instead of a header nav.
> - Create the three routes as placeholder pages with real headings and a one-line description each.
> - Motion should be fast and subtle — 150 to 200ms ease-out — and respect `prefers-reduced-motion`.
> - Visible focus rings on every interactive element. Never remove an outline without replacing it.
>
> Run the dev server on port 4317 so it doesn't collide with anything else. Verify it builds and the
> pages render in both light and dark mode, then commit and push.

---

## Prompt 2 — database and Supabase

> Set up the data layer for Marginalia using Supabase (Postgres with the `pgvector` extension).
>
> I'll create the Supabase project myself. Tell me exactly which values to put in `.env.local`, and
> create a `.env.example` documenting every variable with empty values. Expect these:
> `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
>
> Write the schema as a SQL migration file in `supabase/migrations/`, and also tell me how to apply it
> through the Supabase SQL editor in case the CLI isn't set up. Enable the `vector` extension. Tables:
>
> - `profiles` — id (references auth.users), display_name, created_at
> - `documents` — id, user_id, title, filename, storage_path, page_count, status (an enum:
>   uploaded, parsing, embedding, generating, ready, failed), error_message, created_at
> - `chunks` — id, document_id, content, page_number, token_count, embedding vector(1024)
> - `topics` — id, document_id, name, summary
> - `questions` — id, document_id, topic_id, kind (short_answer or multiple_choice), prompt,
>   reference_answer, options jsonb, source_chunk_ids uuid[], difficulty smallint, created_at
> - `attempts` — id, question_id, user_id, user_answer, score numeric(3,2), feedback, created_at
> - `review_state` — id, question_id, user_id, ease numeric default 2.5, interval_days int default 0,
>   repetitions int default 0, due_at timestamptz, unique on (question_id, user_id)
>
> Add an IVFFlat index on `chunks.embedding` using cosine distance, and indexes on every foreign key
> and on `review_state.due_at`.
>
> Enable Row Level Security on every table with policies restricting rows to the owning user. For
> `chunks`, `topics`, and `questions`, ownership is derived through the parent document. Get this right
> now rather than retrofitting it.
>
> Also write a Postgres function `match_chunks(query_embedding vector(1024), document_id uuid,
> match_count int)` that returns the nearest chunks by cosine distance — we'll call it via RPC for
> retrieval.
>
> Create typed Supabase clients: a browser client, a server client for Server Components and Route
> Handlers, and a service-role client used only in server-side pipeline code. Generate TypeScript
> types from the schema into `lib/database.types.ts`. Do not use `any` anywhere.
>
> Create a Storage bucket named `documents`, private, with a policy allowing users to read and write
> only under their own user id prefix.
>
> Commit and push.

---

## Prompt 3 — the AI provider layer

This is the step that saves you from being locked to a provider that doesn't work from China.

> Build the AI provider layer for Marginalia. Important constraint: I'm in mainland China, so the OpenAI
> API is not reachable for me. I'm using **SiliconFlow**, which is OpenAI-protocol-compatible.
>
> Create `lib/ai/client.ts` that instantiates the official `openai` npm package but with `baseURL`
> and `apiKey` read from environment variables, so the provider is swappable without code changes.
> Add to `.env.example` and document in the README:
>
> - `AI_BASE_URL` (for me: `https://api.siliconflow.cn/v1`)
> - `AI_API_KEY`
> - `AI_CHAT_MODEL` (for me: `deepseek-ai/DeepSeek-V3`)
> - `AI_EMBEDDING_MODEL` (for me: `BAAI/bge-m3`)
> - `AI_EMBEDDING_DIMENSIONS` (1024)
>
> Then build on top of it:
>
> 1. `embedTexts(texts: string[]): Promise<number[][]>` — batches requests (no more than 32 inputs
>    per call), retries on 429 and 5xx with exponential backoff and jitter, and throws a typed
>    `AiError` with a human-readable message on final failure.
> 2. `completeStructured<T>(...)` — a helper that calls the chat model asking for JSON output,
>    validates the response against a Zod schema, and retries once with the validation error appended
>    to the prompt if parsing fails. Every model call in this project goes through this so we never
>    trust raw model output.
> 3. A `lib/ai/prompts/` directory holding system prompts as exported string constants, so they're
>    version-controlled and reviewable rather than buried inline in route handlers.
>
> Add a script `pnpm ai:check` that verifies both the chat and embedding endpoints respond, so I can
> confirm my key works before debugging anything else. Add unit tests for the retry and batching logic
> with the network mocked.
>
> Commit and push.

---

## Prompt 4 — upload and PDF parsing

> Build PDF upload and text extraction for Marginalia. Read `@docs/design.md` and follow it.
>
> Flow: the user drops a PDF on the Library page. It uploads to Supabase Storage under their user id,
> creates a `documents` row with status `uploaded`, then a server-side pipeline extracts the text.
>
> Requirements:
>
> - Use `unpdf` for extraction — it works in serverless environments, unlike most PDF libraries.
>   Extract text **per page** and keep the page numbers; we need them for citations later.
> - Validate on the client and again on the server: PDFs only, 20MB maximum, and reject files with no
>   extractable text with the message "Couldn't read that PDF — it may be a scanned image without a
>   text layer. Try a different file."
> - The upload UI is a drop zone that accepts a drag anywhere on the page, not a hidden file input.
>   Show upload progress, then the processing steps.
> - Update `documents.status` as the pipeline advances, and write a readable `error_message` on
>   failure. The UI polls or subscribes to the row so the user sees real progress rather than a
>   spinner.
> - Derive the document title from the PDF metadata or filename, and let the user rename it.
>
> Build the Library page for real now: a list of document cards showing title, page count, and status,
> with the empty state written exactly as specified in the design doc — a large drop zone with real
> copy, never "No documents found." Include loading skeletons that match the card shape, and an error
> state with a retry.
>
> Commit and push.

---

## Prompt 5 — chunking, embeddings, and retrieval

> Continue the Marginalia document pipeline: after text extraction, chunk and embed the document.
>
> - Chunk to roughly 800 tokens with about 100 tokens of overlap, splitting on paragraph and sentence
>   boundaries rather than mid-sentence. Each chunk keeps its page number. Use `js-tiktoken` or a
>   similar tokenizer for counting — don't estimate by character count.
> - Embed all chunks through the `embedTexts` helper and insert them into `chunks` with their vectors.
>   Do this in batches and update document status to `embedding` while it runs.
> - Implement `searchChunks(documentId, query, limit)` which embeds the query and calls the
>   `match_chunks` RPC. Return content, page number, and similarity score.
> - Handle the whole pipeline as a background job triggered from the upload route so the HTTP request
>   doesn't hang. If a step fails, set status `failed` with a useful message, and make the failure
>   retryable from the UI.
> - Add a small internal debug page at `/debug/search` (dev-only) where I can type a query against a
>   document and see the retrieved chunks with their scores. This is invaluable for judging whether
>   retrieval is actually working before layering the LLM on top of it.
>
> Write unit tests for the chunker: correct overlap, no chunk exceeding the limit, page numbers
> preserved, and sane handling of a single very long paragraph.
>
> Commit and push.

---

## Prompt 6 — topic extraction and question generation

This is the quality-critical step. The grounding rule is the whole point.

> Build topic extraction and question generation for Marginalia.
>
> **Topics.** After embedding, sample representative chunks across the document and ask the chat model
> to return 5 to 12 topics, each with a name and a one-sentence summary. Validate with Zod, insert into
> `topics`. Topics should be specific to the material — "Dijkstra's algorithm and priority queues", not
> "Chapter 3".
>
> **Questions.** For each topic: retrieve the top chunks for that topic via vector search, then ask the
> model to write questions using **only** those chunks.
>
> This grounding rule is the most important requirement in the entire project. State it explicitly and
> forcefully in the system prompt: the model must not use its own general knowledge, must not ask about
> anything absent from the provided passages, and must return the ids of the chunks each question came
> from. If it cannot write a good question from the passages, it should return fewer questions rather
> than inventing one. A question about material that isn't in my slides is a bug, not a minor quality
> issue.
>
> For each question generate: `kind` (mostly `short_answer`, some `multiple_choice`), `prompt`,
> `reference_answer` (a model answer, two to four sentences), `options` for multiple choice with
> plausible distractors drawn from the material, `difficulty` 1 to 3, and `source_chunk_ids`.
>
> Aim for 4 to 8 questions per topic. Run generation concurrently across topics with a small
> concurrency limit (use `p-limit`) so a 40-page deck doesn't take five minutes. Insert a
> `review_state` row per question, due immediately.
>
> Build the document detail page at `/documents/[id]` per `@docs/design.md`: title and metadata, the
> topic list with question counts, an expandable question list showing reference answers and source
> pages, and actions to study this document, generate more questions, or delete it. While processing,
> show the honest step-by-step pipeline state described in the design doc.
>
> Commit and push.

---

## Prompt 7 — the study session

> Build the study session for Marginalia at `/study`. Read `@docs/design.md` carefully and follow the
> Study session section closely — this is the most important screen in the app and it should be
> deliberately spare.
>
> - One question at a time, centered, with nothing competing for attention. Question text at 22 to
>   26px with generous line height, capped around 65 characters per line.
> - A thin progress bar showing position in the session. Default session length 10 questions.
> - Question selection: pull questions whose `review_state.due_at` is in the past, weakest topics
>   first, then any never-seen questions. `/study` studies everything due; `/study?document=<id>`
>   restricts to one document.
> - Short answer gets an autofocused textarea. Multiple choice gets selectable options.
> - A "from page 14" affordance under the question that expands to reveal the source passage —
>   present but not distracting.
> - Keyboard first: `Cmd/Ctrl+Enter` submits, `Space` or `Enter` advances after feedback, `1`-`4`
>   select options, `S` reveals the source, `Esc` ends the session. Show the shortcuts subtly on the
>   first question only.
> - The "nothing due" state should feel like a reward: "You're caught up. Next review in 2 days," with
>   options to study ahead or upload something new.
> - Session summary at the end: questions answered, how many correct, which topics improved, which
>   need work, and when the next review is due.
>
> Don't build grading yet — stub the submit handler so it stores the answer and shows a placeholder. I
> want to feel the flow before the AI is in the loop.
>
> Commit and push.

---

## Prompt 8 — grading and feedback

> Add AI grading to the Marginalia study session.
>
> When the user submits a short answer, call the chat model with the question, the reference answer,
> the source chunks the question came from, and the user's answer. Return, validated with Zod:
>
> - `score` — 0 to 1
> - `verdict` — correct, partial, or incorrect
> - `whatYouGotRight` — a short list, empty if nothing
> - `whatYouMissed` — a short list
> - `explanation` — two to four sentences teaching the gap, grounded in the source passages
>
> Grading guidance for the system prompt: judge understanding, not wording. A correct answer phrased
> differently from the reference is correct. Accept answers in English or Chinese regardless of which
> language the material is in. Be encouraging but honest — don't award credit for an answer that
> misses the core idea, because a grader that always says "close!" makes the app useless. Never mark
> something wrong for information absent from the source material.
>
> Multiple choice is graded locally, no model call — but still show the explanation of why the correct
> option is right.
>
> UI, per `@docs/design.md`: the question stays in place and feedback appears below it so the user can
> compare. Verdict with both a color and a word. Stream the explanation as it generates rather than
> showing a blank wait. Reveal the source passage with the relevant sentence highlighted. Use
> `aria-live` on the feedback region.
>
> Store every attempt in `attempts`. Handle model failures gracefully: if grading fails, say "Couldn't
> grade that — the model is busy" and let the user retry without losing their typed answer. Losing a
> user's typed answer to a network error is unacceptable.
>
> Commit and push.

---

## Prompt 9 — the spaced repetition scheduler

This is the step with the best tests-to-effort ratio in the project. Don't skip the tests.

> Implement the spaced repetition scheduler for Marginalia in `lib/scheduler.ts`. Write it as a **pure
> function** — no database access, no side effects — so it's fully testable:
>
>     schedule(current: ReviewState, score: number, now: Date): ReviewState
>
> A trimmed SM-2. Given the current `ease` (default 2.5), `interval_days`, `repetitions`, and a score
> from 0 to 1:
>
> - score >= 0.8 — correct. Increment repetitions. Interval goes 1 day, then 3 days, then
>   `previous * ease`. Nudge ease up slightly, capped at 3.0.
> - score between 0.5 and 0.8 — shaky. Interval becomes 1 day, ease drops by 0.05.
> - score < 0.5 — wrong. Reset repetitions to 0 and interval to 0 so it comes back in this same
>   session. Ease drops by 0.2, with a floor of 1.3.
>
> Cap intervals at 180 days. Add a small random jitter of a few percent to computed `due_at` values so
> reviews don't clump on the same day.
>
> Write thorough unit tests with Vitest: each branch, the ease floor and cap, a long correct streak
> producing growing intervals, a wrong answer after a long streak resetting properly, and boundary
> values at exactly 0.5 and 0.8.
>
> Also add `topicMastery(recentScores: number[]): { value: number; state: 'new' | 'learning' | 'shaky'
> | 'solid' }` — a weighted average favouring recent attempts, with the state thresholds from
> `@docs/design.md`. Test it too, including the empty-array case.
>
> Wire the scheduler into the grading flow so every attempt updates `review_state`.
>
> Commit and push.

---

## Prompt 10 — progress dashboard

> Build the Marginalia progress dashboard at `/progress`, following `@docs/design.md`.
>
> - A grid of topic cards across all documents, **sorted weakest first**, each showing the topic name,
>   its document, a mastery bar, a state label, question count, and how many are due. Sorting weakest
>   first is deliberate: the page should tell me what to do, not make me interpret a chart.
> - An activity heatmap of the last 12 weeks, from attempt counts per day.
> - A line chart of average score over time, using Recharts, restyled to match the app rather than
>   left on library defaults.
> - A current study streak.
>
> Keep it to those four things. Compute the aggregates in Postgres — a database view or an RPC — not by
> pulling every attempt into the client.
>
> Include the empty state ("Study a few questions and your progress will show up here"), loading
> skeletons, and correct mobile layout. Every color must be paired with a text label.
>
> Commit and push.

---

## Prompt 11 — auth

> Add authentication to Marginalia using Supabase Auth with email magic links.
>
> - A sign-in page that's clean and minimal — email field, one button, a clear "check your inbox"
>   confirmation state, and a visible error state for an invalid email.
> - Middleware protecting all app routes and refreshing the session.
> - A trigger creating a `profiles` row on signup.
> - A user menu in the header with the email address and sign out.
> - Verify Row Level Security actually works: confirm that with two accounts, neither can read the
>   other's documents, chunks, questions, or attempts. Tell me how you verified this.
> - Replace any hardcoded or placeholder user id from earlier steps with the real session user.
>
> Commit and push.

---

## Prompt 12 — polish, README, and CI

> Final pass on Marginalia before deploying. Go through the app and fix what isn't finished:
>
> 1. **Every async surface** needs loading, empty, and error states, per `@docs/design.md`. Skeletons
>    matching content shape, not centered spinners. Named steps for anything over two seconds. Human
>    error messages with a retry, never a raw stack trace.
> 2. **Mobile.** Test at 375px. The study session in particular must be genuinely usable on a phone,
>    with the submit button reachable by thumb.
> 3. **Accessibility.** Run through with the keyboard only, top to bottom, and fix whatever you can't
>    reach. Check contrast on body text. Confirm `aria-live` announces grading feedback.
> 4. **Error boundaries** and a real `not-found` page, both written in the app's voice.
> 5. **Metadata**: title, description, favicon, and an OG image — the OG image matters because it's
>    what shows when you share the link on LinkedIn.
> 6. **Rewrite the README as a portfolio piece**: one-line description, screenshot or GIF at the very
>    top, live demo link, the problem it solves, the stack, local setup with every environment
>    variable documented, a short "how it works" section covering the RAG pipeline and the scheduler,
>    and one paragraph on an interesting technical decision — I'd pick either the grounding rule that
>    questions may only come from retrieved chunks, or the provider-agnostic AI layer that lets the app
>    run against any OpenAI-compatible endpoint. Keep it honest; no invented metrics.
> 7. **GitHub Actions** workflow running typecheck, lint, and tests on push and pull request. Add the
>    status badge to the README.
> 8. Run typecheck, lint, and the full test suite, and fix everything that fails.
>
> Commit and push.

---

## Prompt 13 — deploy

> Deploy Marginalia and get me a working live URL.
>
> Walk me through deploying to Vercel: which environment variables to set, and what to check
> afterwards. One thing to handle: I'm in mainland China, and `*.vercel.app` domains are intermittently
> blocked here — tell me my options, including putting a custom domain with Cloudflare in front, or
> deploying to Zeabur instead, and which you'd recommend for making the link reliably reachable both
> in China and abroad.
>
> Before deploying, verify the production build succeeds locally and that nothing depends on a dev-only
> code path. Make sure the dev-only debug search page is excluded from production.
>
> After it's live, update the README with the real URL, and take screenshots of the Library, a study
> session with feedback showing, and the Progress page. Put the best one at the top of the README.
>
> Commit and push.

---

## Useful follow-up prompts

Keep these for when things go sideways, or for after v1 is live.

**When generated questions are bad:**

> The questions generated for this document are too shallow — they're asking for definitions rather
> than understanding. Show me the current generation system prompt, and let's revise it to ask for
> questions that require applying or comparing concepts. Also check whether the retrieved chunks are
> actually relevant before we blame the prompt; use the debug search page to show me what's being
> retrieved for a topic.

**When grading feels wrong:**

> The grader is being too generous — it gave me 0.9 for an answer that missed the main point. Show me
> the grading prompt and the last few attempts with their scores, and let's tighten the rubric. Then
> add an eval: a fixture of 15 question/answer pairs with the scores I'd give them, and a test that
> checks the grader lands within 0.15 of my scores. I want to be able to change the prompt without
> silently regressing the grading.

**The eval set, as its own step (strongly recommended once v1 works):**

> Build an evaluation harness for Marginalia's AI features. Create a fixtures directory with 15 to 20
> hand-labelled examples: for grading, a question plus reference answer plus a user answer plus the
> score I think it deserves; for generation, a set of chunks plus a note on whether a produced
> question is properly grounded in them. Write a script `pnpm eval` that runs the real model against
> the fixtures and reports mean absolute error on grading scores plus a grounding pass rate, and
> writes results to a file so I can compare runs after changing a prompt. Document it in the README —
> this is the part of the project I most want to be able to talk about in an interview.

**When you want to understand your own code before an interview:**

> Walk me through how a question gets from an uploaded PDF to appearing in a study session, naming
> each file involved and what it does. Then ask me three questions about the implementation that an
> interviewer might ask, and tell me how good my answers are. I want to be able to defend every part
> of this codebase.
