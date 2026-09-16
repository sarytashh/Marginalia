# Project rules for the Recall repo

Send this as a follow-up message right after Prompt 0, prefaced with:
"Put this in `.cursor/rules/project.mdc` and follow it for the rest of the project."

These rules are what keep quality consistent across a long build. Without them the agent's choices
drift between sessions — different error-handling styles, different data-fetching patterns, and a
codebase that looks like four people wrote it.

---

    # Recall — project rules

    ## What this project is

    Recall is an AI study tutor. Users upload lecture-slide PDFs; the app extracts and embeds the
    text, generates practice questions grounded strictly in that material, grades free-text answers,
    and schedules reviews with spaced repetition.

    This is a portfolio project for a first-year CS student applying to internships. The code and the
    git history are part of the deliverable, not just the running app.

    ## Non-negotiable rules

    - **Questions and grading are grounded only in retrieved source chunks.** The model must never
      draw on its own general knowledge about a subject. A question about material absent from the
      user's document is a bug. Every question stores the chunk ids it came from.
    - **Never trust raw model output.** Every model response is validated against a Zod schema before
      it touches the database or the UI.
    - **Never lose user input.** If grading fails, the typed answer stays on screen and the user can
      retry.
    - **Never commit secrets.** Keys live in `.env.local`, which is gitignored. `.env.example`
      documents every variable with empty values.
    - **The AI provider is swappable via environment variables.** Base URL, key, and model names are
      never hardcoded. The app must work against any OpenAI-compatible endpoint.

    ## Code standards

    - TypeScript strict mode. No `any`, no non-null assertions to silence the compiler, no
      `@ts-ignore`. If a type is hard, model it properly.
    - Server Components by default. Add `"use client"` only where interactivity requires it.
    - Data fetching in Server Components or Route Handlers; never fetch from the client with the
      service-role key.
    - Keep AI system prompts in `lib/ai/prompts/` as exported constants, not inline in handlers, so
      they can be reviewed and diffed.
    - Pure business logic (the scheduler, the chunker, mastery calculation) lives in `lib/` as pure
      functions with unit tests. Anything with real logic in it gets tested.
    - Handle errors at the boundary: catch, log the technical detail server-side, return a
      human-readable message to the client. Users never see a stack trace or a raw provider error.
    - Retry external API calls on 429 and 5xx with exponential backoff.
    - Prefer clear names over short ones. `sourceChunkIds`, not `scids`.

    ## Comments

    Comment only to explain a constraint or trade-off the code cannot express. Never narrate what the
    next line does. Never write a comment explaining that a change was made or why it's correct — the
    git history is for that.

    ## Design standards

    Follow `docs/design.md`. In particular:

    - Every async surface has loading, empty, and error states. Skeletons that match content shape,
      not centered spinners. Empty states have real copy and the relevant action, never "No results
      found."
    - Real copy everywhere. No lorem ipsum, no "Welcome to your app," no placeholder text shipped.
    - Mobile works. The study session is designed at 375px first.
    - Visible focus rings on everything. Full keyboard operability of the study session.
    - Color is never the only carrier of meaning; pair it with a label or icon.
    - Motion is 150 to 200ms ease-out, and respects `prefers-reduced-motion`.
    - Use shadcn/ui primitives. Never hand-roll a dialog, dropdown, or tooltip.

    ## Git practices

    - Commit after each logical, working change. Never bundle unrelated changes.
    - Imperative mood, specific subject: "Add IVFFlat index on chunk embeddings", not "updates".
    - Push after each commit. Never force-push, never amend a pushed commit.
    - Run typecheck and tests before committing. Don't commit a broken build.

    ## Working style

    - Before a multi-step change, say briefly what you're going to do.
    - When something can't be verified, say so plainly rather than claiming it works.
    - Don't add dependencies for things the standard library or an existing dependency already does.
    - Don't add features that weren't asked for. If you think something is missing, mention it instead
      of building it.
