# Recall — design spec

This is the visual and interaction brief. Hand it to the coding agent alongside the prompts, or
paste the relevant section when you're building that screen.

## Design principle

The app has one job: get you into a question and out of it with as little friction as possible.
Every decision below serves that. Studying is already unpleasant; the interface should be calm,
quiet, and never make you think about the interface.

The reference feel is a good reading app — Linear's precision, Readwise's calm, Anki's speed — not
a SaaS dashboard. No gradients, no glassmorphism, no marketing hero on the app screens.

## Visual direction

**Typography.** One family for UI: Geist Sans or Inter. Question text is the exception and it should
be noticeably larger than everything else — 22 to 26px, generous line height around 1.6, and capped
at roughly 65 characters per line. This is the single highest-leverage design decision in the whole
app, because the question is what the user is actually there for. If you want one accent of
personality, set question text in a serif (Instrument Serif, Source Serif) and keep the rest sans.

**Color.** Restrained. A warm off-white surface rather than pure white (`#FAFAF9`-ish), near-black
text that isn't `#000`, and exactly one accent color used for primary actions and focus rings. Pick
something less expected than blue — a deep indigo, or a muted teal. Ship dark mode, and make it a
true dark (near-black background, not navy).

Semantic colors carry meaning and should be used *only* for mastery and grading state:

| State | Meaning | Feel |
| --- | --- | --- |
| New | never studied | neutral gray |
| Learning | seen once or twice | amber |
| Shaky | recent scores below 0.7 | orange / red |
| Solid | consistently correct | green |

Never use color as the only signal — pair every one with a label or an icon, both for accessibility
and because it reads as more considered.

**Space and shape.** An 8px spacing scale. Generous padding inside cards, tight spacing between
related items. Radii around 10 to 12px — soft but not pill-shaped. Borders over shadows for
separating things; keep shadows for genuinely floating elements like dialogs and popovers. One
consistent max content width, roughly 720px for reading surfaces and 1100px for the dashboard.

**Motion.** Fast and almost invisible: 150 to 200ms, ease-out. Animate the transition between
questions and the reveal of feedback. Nothing else. Respect `prefers-reduced-motion`.

## Screens

### 1. Library — `/`

The home surface. A list of your uploaded materials, plus one obvious primary action.

Each document is a card showing the title, page count, how many questions exist, a mastery bar, and
"12 due now" if anything is due. The whole card is clickable and goes to the document detail. A
prominent "Start studying" button sits at the top and pulls from everything due across all
documents — because most days you don't want to choose, you just want to start.

Upload is a drop zone, not a button hidden in a menu. Dragging a PDF anywhere onto the page should
work.

**Empty state.** This is the most important screen in the app and the one most projects get wrong.
It should show a large drop zone with real copy — "Drop your lecture slides here. Recall reads them
and turns them into practice questions." Include one line about what happens next so the upload
doesn't feel like a leap of faith. Do not write "No documents found."

### 2. Document detail — `/documents/[id]`

Title, page count, upload date. A list of extracted topics, each with a mastery bar and a question
count. A list of generated questions you can expand to see the reference answer. Buttons to study
just this document, generate more questions, or delete it.

While the document is still processing, show the pipeline honestly: parsing pages, then embedding,
then finding topics, then writing questions — with the current step active. Users forgive a 30-second
wait when they can see what's happening; they don't forgive a spinner.

### 3. Study session — `/study`

The screen that matters. Deliberately spare.

One question, centered, nothing else competing with it. A thin progress bar at the top showing where
you are in the session. A small "from page 14" affordance under the question that expands to show the
source passage — available but not distracting. A textarea for short-answer questions that is
autofocused, or options for multiple choice.

Keyboard first, always:

- `Cmd/Ctrl + Enter` submits an answer
- `Space` or `Enter` advances to the next question after feedback
- `1` through `4` select multiple-choice options
- `S` reveals the source passage
- `Esc` ends the session

Show the shortcuts once, subtly, on the first question. Then get out of the way.

**Feedback state.** After submitting, the question stays in place and feedback appears below it —
don't navigate away, the user needs to compare. Show a verdict (correct / partially correct /
incorrect) with color and a word, what they got right, what they missed, the reference answer, and
the source passage with the relevant sentence highlighted. Stream the feedback in as it generates;
the wait is dead time otherwise.

**Session complete.** How many questions, how many correct, which topics improved, which need work,
and when the next review is due. One button back to the library, one to keep going.

**Nothing due.** "You're caught up. Next review in 2 days." Offer to study ahead anyway or upload
something new. A caught-up state should feel like a reward, not a dead end.

### 4. Progress — `/progress`

A grid of topic cards across all documents, sorted by weakest first, each with its mastery bar and
state label. Sorting by weakest is a small decision with real consequences: it makes the app tell you
what to do rather than making you interpret a chart.

Below that: a small activity heatmap of the last few weeks, a line chart of average score over time,
and a current streak. Keep it to those three. Dashboards get worse as they get bigger.

## States to build for every async surface

Being thorough here is most of what separates a project that feels real from one that feels like a
demo. For upload, parsing, question generation, and grading, each needs:

- **Loading** — skeletons that match the shape of the real content, not a centered spinner. For
  anything over two seconds, name the step.
- **Empty** — real copy explaining what to do, with the action right there.
- **Error** — say what failed in human language, and give a retry. "Couldn't read that PDF — it may
  be a scanned image without text. Try a different file." Never surface a raw stack trace.
- **Partial** — a document can be parsed but not yet embedded. Show it as usable-but-incomplete
  rather than hiding it.
- **Offline / rate-limited** — the model API will occasionally fail. Catch it, say "The model is busy,
  retrying," and actually retry with backoff.

## Responsive

Design the study session at 375px width first — it's the screen you'll genuinely use, on your phone,
between classes. On mobile: bottom navigation with three items (Library, Study, Progress), dialogs
become bottom sheets, the answer textarea sits above the keyboard with the submit button reachable by
thumb. On desktop the study session is a centered column, not a stretched one.

## Accessibility

Not optional, and cheap if you do it from the start. Visible focus rings on everything (never
`outline: none` without a replacement), 4.5:1 contrast minimum on body text, real `<label>`s on the
answer inputs, `aria-live` on the feedback region so a screen reader announces the result, and full
keyboard operability of the study session — which you get for free since you built it keyboard-first.
