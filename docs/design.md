# Marginalia — complete product design specification

This document is the single source of truth for the visual design, interaction design, content,
responsive behavior, and application states of Marginalia.

It is written for the AI coding agent implementing the product. Follow it across every screen.
Do not invent a different visual direction, fall back to generic shadcn defaults, or treat this as
optional inspiration. When a later prompt conflicts with this document on visual design, this
document wins.

## 1. Product and experience

Marginalia is an AI study tutor. A student uploads lecture PDFs, Marginalia turns them into grounded
practice questions, grades free-text answers, and schedules weak material for review.

The product should feel like a beautifully typeset academic journal made interactive: thoughtful,
precise, quiet, and trustworthy. It should not look like an admin dashboard, an AI chatbot, a
children's learning app, or a template marketplace.

The experience has one central rhythm:

1. The student arrives and sees what is worth studying.
2. They add material or begin a due review.
3. The interface removes distractions and presents one question.
4. Feedback appears in context, supported by a visible citation.
5. The app records the result and quietly schedules the next review.
6. Progress makes weak areas legible without turning study into a game.

At every point, the interface should answer:

- Where am I?
- What should I do next?
- What is Marginalia doing?
- Why did Marginalia produce this question or grade?
- Will my work be lost if something fails?



## 2. Chosen visual direction: Editorial Academic



### 2.1 Character

Imagine a serious university press publication, a well-designed literary journal, and a precise
modern productivity tool sharing one system.

The design is:

- warm rather than sterile;
- editorial rather than card-heavy;
- restrained rather than decorative;
- authoritative without being intimidating;
- tactile through paper-like surfaces and fine rules, not fake textures;
- contemporary, never vintage or ornamental.

The signature visual elements are:

- large serif headlines and study questions;
- compact sans-serif interface labels;
- warm ivory page backgrounds;
- deep ink text;
- muted burgundy for primary actions;
- hairline separators;
- asymmetric editorial grids;
- small page, chapter, and issue-like metadata;
- generous negative space.



### 2.2 Explicitly avoid

Do not use:

- gradients;
- glassmorphism or translucent cards;
- blue or purple SaaS color schemes;
- oversized rounded cards everywhere;
- pill-shaped controls unless the object is genuinely a tag or status;
- dashboard grids in which every piece of content is boxed;
- illustrations of robots, brains, books, sparkles, or magic wands;
- chat bubbles as the main AI interaction;
- glowing effects, neon, or heavy drop shadows;
- gamification such as confetti, coins, XP, trophies, or cartoon streak flames;
- generic copy such as “Welcome back,” “Unlock your potential,” or “No data found.”



## 3. Design foundations



### 3.1 Color

Light mode is the primary art direction.


| Role          | Color                                     | Usage                                     |
| ------------- | ----------------------------------------- | ----------------------------------------- |
| Canvas        | warm ivory, approximately `#F4F0E8`       | page background                           |
| Paper         | soft cream, approximately `#FBF9F4`       | reading surfaces and focused content      |
| Ink           | deep brown-black, approximately `#211E1B` | primary text                              |
| Muted ink     | warm gray-brown, approximately `#716A62`  | metadata and secondary copy               |
| Rule          | warm gray, approximately `#D8D0C5`        | borders and separators                    |
| Primary       | muted burgundy, approximately `#7D2E3B`   | primary actions, active navigation, focus |
| Primary hover | deep burgundy, approximately `#652430`    | hover and pressed state                   |
| Selection     | pale rose, approximately `#EAD9DC`        | selected rows and text highlights         |


Semantic colors are reserved for feedback and mastery. Never use them decoratively.


| State      | Color family | Required text label     |
| ---------- | ------------ | ----------------------- |
| New        | warm gray    | New                     |
| Learning   | ochre        | Learning                |
| Shaky      | muted rust   | Needs review            |
| Solid      | forest green | Solid                   |
| Correct    | forest green | Correct                 |
| Partial    | ochre        | Partially correct       |
| Incorrect  | muted rust   | Incorrect               |
| Processing | burgundy     | Current processing step |


Every semantic color must be paired with a word, icon, pattern, or value. Color alone must never
carry meaning.

#### Dark mode

Dark mode should feel like reading in a quiet archive at night:

- canvas: warm near-black, not navy;
- paper: slightly lighter charcoal-brown;
- text: soft parchment, never pure white;
- rules: low-contrast warm gray;
- burgundy accent: slightly lighter and less saturated for contrast;
- semantic colors: adjusted for accessibility without becoming neon.

Dark mode must preserve hierarchy and paper-versus-canvas layering. Do not simply invert colors.

### 3.2 Typography

Use two type families and give each a strict role:

- **Editorial serif:** Instrument Serif, Source Serif 4, or Newsreader. Used for the Marginalia wordmark,
page titles, document titles, questions, major numbers, and quotations from source material.
- **Interface sans-serif:** Geist Sans or Inter. Used for navigation, buttons, labels, form fields,
metadata, tables, status text, and explanatory copy.

Typography creates most of the visual identity. Do not replace serif display text with bold sans.

Recommended hierarchy:

- application wordmark: serif, 26–30px, regular;
- page title: serif, 46–56px desktop and 34–40px mobile, regular;
- study question: serif, 30–38px desktop and 25–30px mobile, 1.35–1.5 line height;
- section title: serif, 26–32px;
- card or document title: serif, 21–25px;
- body: sans, 15–17px, 1.55–1.7 line height;
- control text: sans, 14–15px, medium;
- editorial metadata: sans, 11–12px, uppercase, increased letter spacing;
- numerical progress: serif or tabular sans depending on context.

Keep reading lines between 55 and 70 characters. Questions and explanations should never stretch
across the full browser width.

Do not use more than three font weights. Hierarchy comes from family, scale, spacing, and placement,
not from making everything bold.

### 3.3 Layout

Use a 12-column editorial grid on large screens.

- Maximum app width: approximately 1200px.
- Standard desktop side padding: 40–56px.
- Tablet padding: 28–32px.
- Mobile padding: 18–20px.
- Reading column: 680–760px.
- Wide dashboard content: up to 1120px.
- Main vertical page spacing: 56–80px desktop, 32–48px mobile.

Prefer open sections separated by rules and whitespace over nested cards. Use asymmetric columns
where metadata or context can sit in a narrow margin beside the main reading area.

### 3.4 Shape and elevation

- Default border radius: 2–4px for editorial surfaces and inputs.
- Small controls may use 6px.
- Do not use large soft 16px cards.
- Use 1px hairline borders in the Rule color.
- Use shadows only for content that physically floats: dialogs, menus, and mobile sheets.
- Focused reading surfaces can use a barely perceptible shadow plus a border.
- Buttons are rectangular, compact, and purposeful—not pill-shaped.



### 3.5 Iconography

Use a single restrained outline icon set. Icons are 16–18px and normally accompany a label.
No filled cartoon icons. Use familiar symbols for upload, close, menu, source, settings, retry,
previous, and next. Do not use a sparkle icon as shorthand for AI.

### 3.6 Motion

Motion is functional and nearly invisible:

- standard duration: 160–200ms ease-out;
- question transition: slight vertical movement plus fade, no carousel slide;
- feedback reveal: content expands below the answer with a soft fade;
- menus and dialogs: quick fade and 4–8px movement;
- mastery bars: animate only when a value changes after an answer;
- processing progress: restrained movement, no looping decorative animation.

Respect `prefers-reduced-motion` and remove nonessential transitions.

## 4. Global application structure



### 4.1 Desktop header

The header is a thin editorial masthead, not a conventional SaaS navbar.

- Left: serif Marginalia wordmark.
- Center or left-center: Library, Study, Progress.
- Right: compact due count such as “12 due,” theme control, and profile menu.
- A hairline rule runs beneath the header.
- The active route is indicated by burgundy text and a short underline, not a filled tab.
- Header height should feel compact, around 64–72px.

The header remains visible but should not dominate. During a study session it simplifies: wordmark,
session progress, and an “End session” action only.

### 4.2 Mobile navigation

Use a bottom navigation bar with Library, Study, and Progress.

- Labels are always visible.
- The active item uses burgundy plus a short top rule.
- Respect device safe areas.
- During an active session, replace normal bottom navigation with the answer action area so the
keyboard and submit control remain reachable.



### 4.3 Global feedback

- Success messages are quiet, one sentence, and disappear automatically.
- Errors stay visible until dismissed or resolved.
- Destructive actions always require confirmation.
- A toast may confirm secondary actions such as rename or copy.
- Never use a toast for information the user must act on; place that message inline.



## 5. Authentication



### 5.1 Sign in

The sign-in page should resemble the opening page of a journal.

- Small Marginalia wordmark at top.
- Large serif heading: “Return to your studies.”
- Short sans-serif explanation of the magic-link flow.
- One email field and one burgundy “Send sign-in link” button.
- A quiet note explaining that no password is needed.
- A narrow centered column with generous top and bottom space.

Actions and states:

- Empty email: do not show an error until submit.
- Invalid email: show a precise inline message directly beneath the field.
- Sending: retain the entered email, disable duplicate submit, change button text to “Sending…”.
- Success: replace the form with “Check your inbox” and show the destination email. Include
“Use a different email.”
- Expired or invalid link: explain what happened and offer a new link.
- Provider/network error: keep the email and provide Retry.



### 5.2 First entry

Do not show a product tour modal. The empty Library already teaches the product. If a display name
is needed, ask for it in a small inline setup step and let the user continue immediately.

## 6. Library / home — `/`

The Library is the daily starting point. It should answer “What should I study?” before “What files
do I own?”

### 6.1 Returning user layout

Top editorial spread:

- left, small uppercase date or “TODAY” label;
- large serif heading chosen by state:
  - “Twelve questions are waiting.”
  - “You are caught up.”
  - “Begin with your weakest topic.”
- below, one sentence summarizing the recommended action;
- burgundy primary action: “Start due review”;
- secondary text action: “Study ahead.”

Beside or below this introduction, show a restrained review summary: due now, current streak, and
next review. Present it like publication metadata, not three separate statistic cards.

### 6.2 Materials section

Heading row:

- serif “Your materials”;
- document count;
- “Add material” action.

Documents appear as editorial rows or broad paper sheets, not a grid of rounded cards.

Each document row contains:

- document title in serif;
- filename only when it differs meaningfully from the title;
- page count and upload date as compact metadata;
- topic count and question count;
- thin mastery line with percentage and text state;
- due count, if nonzero;
- processing or error status, when relevant;
- overflow menu for Rename and Delete.

The whole principal area opens the document. Actions inside the row remain separately clickable.
Hover slightly changes the paper tone and shifts the title to burgundy. Do not lift the row with a
large shadow.

Sort order: documents with due questions first, then recently opened, then recently uploaded.

### 6.3 Empty Library

This is the real onboarding screen.

Use an asymmetric two-column composition:

- main column: large serif heading “Turn your lecture slides into questions you can answer.”
- short explanation: “Upload a PDF. Marginalia reads the text, finds its topics, and prepares a study
session grounded in your own material.”
- broad ruled drop zone styled like an empty manuscript page;
- primary action “Choose a PDF” and secondary instruction “or drop it anywhere on this page.”
- side note titled “WHAT HAPPENS NEXT” with three numbered steps: Read pages, Find topics, Prepare
questions.

Do not use an illustration or the phrase “No documents.”

### 6.4 Dragging a file

When a valid file enters the browser:

- softly dim the Library;
- display a page-sized ivory drop target outlined in burgundy;
- heading: “Release to add this document”;
- show accepted format and maximum size;
- keep the visual stable so the target does not jump.

Invalid file:

- use a muted rust rule;
- explain “Marginalia currently reads text-based PDFs up to 20 MB.”
- do not upload automatically.



### 6.5 Upload sequence

After choosing a file, open a focused dialog:

1. File selected: filename, size, editable document title.
2. Uploading: horizontal progress and actual percentage.
3. Uploaded: dialog may close; the new document appears at the top and begins processing.

If upload fails, preserve the selected file and title where technically possible. Show Retry and
Cancel. Never make the user select the same file again after a temporary network failure.

## 7. Document processing

Processing can take long enough that it needs an honest narrative.

The document row and detail page show the same ordered steps:

1. Upload complete
2. Reading pages
3. Preparing search index
4. Finding topics
5. Writing questions
6. Ready to study

Completed steps use an ink checkmark, the active step uses burgundy text and a fine active rule,
future steps remain muted. If counts are available, include them: “Reading page 18 of 42.”

Do not use an indefinite spinner as the only signal. The user may leave; explain that processing
continues in the background.

Failure:

- mark the exact failed step;
- show a human explanation;
- offer “Try this step again”;
- retain all completed work;
- offer Delete document as a secondary destructive action.

For a scanned PDF with no text:

“Marginalia could not find readable text in this PDF. It may contain scanned images instead of a text
layer. Try a text-based PDF.”

## 8. Document detail — `/documents/[id]`

This page should read like the opening spread of a course reader.

### 8.1 Header

- breadcrumb back to Library;
- small uppercase “MATERIAL” label;
- document title as a large serif heading;
- filename, pages, upload date, and processing status in one metadata line;
- primary “Study this material” button;
- secondary “Generate more questions” action;
- overflow menu for Rename and Delete.

If questions are due, the primary button includes the number: “Study 8 due questions.”

### 8.2 Topic index

Show topics as a numbered contents list:

- editorial number `01`, `02`, and so on;
- topic name in serif;
- one-sentence summary;
- mastery value, state label, and due count;
- thin mastery line;
- question count.

Clicking a topic expands its questions beneath it or moves to a clearly anchored topic section.
Avoid small cards for each topic. The visual reference is a table of contents.

Actions:

- “Study topic” begins a filtered session.
- “Generate more” appears only when appropriate.
- Weak topics are sorted first by default; provide “Document order” as an alternate sort.



### 8.3 Question archive

Questions appear as a numbered list separated by rules.

Collapsed row:

- question number and type;
- question prompt;
- difficulty and latest result;
- source page.

Expanded row:

- reference answer;
- source excerpt;
- past attempt count and most recent score;
- “Practice this question” action.

Generated content must never look editable unless editing is supported. Do not place answer content
inside disabled text fields.

### 8.4 Rename

Rename in place at the document title, preserving typography and layout. Enter saves,
Escape cancels. Also provide explicit Save and Cancel for touch users.

### 8.5 Delete

Confirmation dialog:

- heading “Delete this material?”
- name the document;
- explain that its topics, questions, attempts, and review schedule will be removed;
- primary destructive action “Delete material”;
- safe action “Keep material” receives initial focus.

After deletion, return to Library and show a confirmation. Do not offer fake undo if deletion is not
actually reversible.

## 9. Study setup

Starting study from different places should converge on one lightweight setup.

If there are due questions, start immediately by default. Do not add configuration before every
session.

Optional setup is available from a small “Session options” action:

- scope: all materials, one document, or one topic;
- length: 5, 10, 20, or all due;
- question types: mixed, short answer, multiple choice.

Remember the last session length. Never require users to configure difficulty manually; the
scheduler already decides what matters.

## 10. Active study session — `/study`

This is the product’s most important screen. It becomes a focused reading page.

### 10.1 Session frame

Desktop:

- simplified top masthead;
- left: Marginalia wordmark that does not navigate accidentally;
- center: thin progress rule and “04 of 10”;
- right: “End session” text action;
- main question in a 680–720px reading column;
- a narrow margin column may show topic and document metadata.

Mobile:

- compact top row with progress and End;
- question uses the full content width with 18–20px margins;
- submit action stays reachable above the software keyboard;
- no normal bottom navigation while the session is active.



### 10.2 Question anatomy

Order:

1. small uppercase topic label;
2. large serif question;
3. source disclosure such as “LECTURE 06 · PAGE 14”;
4. response input;
5. action row;
6. feedback after submit.

The question is the strongest element on screen. Do not put it inside a decorative rounded card.

### 10.3 Source disclosure

Before answering, the user may open the source:

- label uses a small page/document icon and exact page;
- expansion reveals a cream excerpt block with a burgundy left rule;
- source text is serif body copy;
- show enough surrounding context to understand the passage;
- collapse action is obvious;
- opening the source does not affect grading.

Keyboard `S` toggles the source when the answer field is not actively receiving that character.
Do not hijack typing inside the textarea.

### 10.4 Short-answer input

- large paper-like textarea with an understated bottom or full hairline border;
- comfortable minimum height for four to six lines;
- prompt text: “Write what you understand in your own words…”
- no character counter unless a real limit exists;
- automatically focus on desktop, but avoid forcing the mobile keyboard open on page load;
- preserve text until the attempt is successfully stored.

Primary action: “Check answer.”
Shortcut shown quietly: `⌘ Enter` or `Ctrl Enter`.

Empty submit does not trigger grading. Give subtle inline guidance rather than an error toast.

### 10.5 Multiple choice

Options are full-width editorial rows labeled A–D.

- default: paper background, hairline rule;
- hover: slight rose tint;
- selected: burgundy left rule, pale rose background, visible check/radio;
- keyboard keys `1–4` select;
- Enter checks after selection;
- no correctness color appears before submission.



### 10.6 Submitting and grading

On submit:

- lock the submitted response against accidental edits but keep it fully readable;
- button becomes “Reading your answer…”;
- show progress in the feedback location so layout does not jump;
- stream explanation text when available;
- allow cancellation only if it can be implemented safely.

If grading fails:

- keep the user’s answer visible and locally preserved;
- unlock Retry;
- message: “Marginalia could not grade this answer right now. Your response is safe.”
- offer “Try grading again” and “Skip for now.”

Never advance automatically after grading.

### 10.7 Feedback

Feedback unfolds directly beneath the answer, separated by a strong horizontal rule.

Header:

- verdict word in sans-serif;
- score or qualitative result;
- semantic icon and color;
- no celebratory animation.

Body:

1. “What you understood” — concise bullets; omit if empty.
2. “What to revisit” — concise bullets; omit if empty.
3. “A complete answer” — serif reference answer.
4. “From your material” — cited source excerpt with the supporting sentence highlighted in pale rose.

For correct answers, still show the reference answer in a collapsed “Compare answers” disclosure.
For partial or incorrect answers, show the teaching explanation expanded.

Bottom action:

- primary “Next question”;
- secondary “Ask for an explanation” only if that feature exists;
- keyboard Enter or Space advances only when focus is not inside another control.

Use an `aria-live` region for the verdict. Move focus to the feedback heading only for screen-reader
users or when navigation context requires it; do not disrupt visual keyboard users unnecessarily.

### 10.8 Ending early

`Esc` or End session opens a small confirmation:

- “End this session?”
- “Your 6 completed answers are already saved.”
- primary safe action “Continue studying”;
- secondary “End session.”

Ending never discards completed attempts.

### 10.9 No questions due

Present this as completion, not emptiness:

- small uppercase “ALL CAUGHT UP”;
- large serif “Nothing is waiting for review.”
- next scheduled review date;
- restrained summary of today’s work;
- primary “Study ahead”;
- secondary “Return to Library”;
- optional “Add new material.”

No confetti or trophy illustration.

## 11. Session complete

The summary resembles the closing page of an issue.

- small “SESSION COMPLETE” label;
- large serif statement such as “Eight of ten ideas held.”
- completed count and average score;
- topic movements: improved, unchanged, needs review;
- exact next review timing;
- one short editorial note: “Negative edge weights will return tomorrow.”

Actions:

- primary “Return to Library”;
- secondary “Continue with 5 more” when questions are available;
- text action “Review this session” to inspect answers.

Do not reduce the whole session to a circular score graphic. The useful result is what to revisit.

## 12. Progress — `/progress`

The Progress page should read like an analytical report, not a financial dashboard.

### 12.1 Opening

- small uppercase “PROGRESS” label;
- large serif heading describing the current state, for example “Graph theory needs another pass.”
- one-sentence summary generated from actual data, not AI marketing copy;
- date range control styled as compact text, not a giant dropdown.



### 12.2 Topic mastery

This is the first and largest section.

Topics are an editorial ranked list, weakest first:

- rank number;
- topic name and document;
- mastery percentage and text state;
- due count;
- thin mastery line;
- compact “Study” action.

The weakest one to three topics receive emphasis through ordering and a burgundy margin marker, not
a red alarm card.

Allow sorting by Weakest, Most due, and Document. Default remains Weakest.

### 12.3 Study activity

The activity heatmap should look like a compact printed calendar:

- last 12 weeks;
- neutral empty cells;
- burgundy intensity for attempts;
- tooltip with date, questions answered, and average result;
- accessible textual summary beneath it.

Do not mimic GitHub green exactly.

### 12.4 Score over time

Use one restrained line chart:

- burgundy line;
- warm rule-colored grid lines;
- no gradient fill;
- direct labels or a simple legend;
- selectable range;
- tooltip with date, average score, and attempt count.

Charts should sit on the canvas without oversized card containers. Separate sections with rules and
space.

### 12.5 Streak

Treat streak as context, not a reward system.

Show “6 study days in a row” in serif, with the longest streak and total sessions as small metadata.
Do not use flames or imply that missing one day is failure.

### 12.6 Empty progress

- heading: “Your first answers will become a study map.”
- explain that Marginalia will identify strong and weak topics after a few attempts;
- primary “Start studying” if questions exist;
- otherwise “Add material.”



## 13. Profile and preferences

Profile opens as a compact menu from the masthead. It contains email, Theme, and Sign out.

A separate Settings page is warranted only when there are enough settings. If included:

- Account: display name and email;
- Appearance: Light, Dark, System;
- Study defaults: session length and question type;
- Data: export and delete account when implemented.

Use section headings and ruled rows, not a grid of settings cards.

Sign out happens immediately after activation unless unsaved work exists. During an answer, warn
that the current unsubmitted response may be lost.

Account deletion is distinct from document deletion and requires typing a confirmation phrase.

## 14. Shared application states

Every asynchronous surface—authentication, upload, parsing, embedding, topic extraction, question
generation, retrieval, grading, deletion, and progress loading—must implement all applicable states.

### 14.1 Loading

- Use skeletons that match the final content geometry.
- Skeleton color is a subtle warm-gray paper tone.
- Do not animate aggressively; a slow low-contrast pulse is enough.
- If loading exceeds roughly two seconds, name the active operation.
- Preserve the previous usable content during background refresh.



### 14.2 Empty

An empty state explains:

1. what is absent;
2. why the user may care;
3. the single best next action.

Never say only “No items found.”

### 14.3 Error

An error explains:

1. what could not be completed in human language;
2. whether existing work is safe;
3. what the user can do next.

Place Retry beside the message. Technical details belong in server logs, never in the product.

### 14.4 Offline and rate limited

- Show a persistent narrow notice beneath the masthead.
- Offline: “You appear to be offline. Your current answer will stay here.”
- Rate limited: “The study model is busy. Marginalia will retry shortly.”
- Actually retry with backoff where safe.
- Never show provider names, status codes, or raw API messages to the student.



### 14.5 Optimistic actions

Use optimistic updates only when failure is reversible and understandable, such as rename. Do not
pretend document processing, grading, or deletion succeeded before the server confirms it.

## 15. Dialogs, menus, and forms



### Dialogs

- Compact paper sheet, sharp-to-subtle radius, fine border, restrained shadow.
- Serif heading and short sans-serif explanation.
- Actions aligned to the end on desktop and stacked with the safest action first on mobile.
- Destructive action is never the default focused control.
- Escape closes nondestructive dialogs.



### Menus

- Warm paper surface;
- short labels with icons only when helpful;
- destructive items separated by a rule;
- full keyboard navigation;
- never hide the principal action only inside a menu.



### Forms

- Labels sit above fields in compact sans-serif.
- Help text appears only when it prevents uncertainty.
- Validation is inline and specific.
- Keep entered values after errors.
- Required fields are clear without filling every label with an asterisk.



## 16. Responsive behavior



### Desktop, 1024px and above

- Full editorial masthead;
- 12-column grid;
- optional narrow metadata margins;
- open ruled sections;
- hover states and keyboard shortcuts.



### Tablet, 768–1023px

- Preserve masthead but tighten navigation;
- collapse margin metadata into the main flow;
- charts remain full width;
- document rows may wrap metadata to a second line.



### Mobile, below 768px

- bottom navigation outside active study;
- one-column layout;
- page headings reduce but remain distinctly serif;
- rows become stacked sections, not horizontally scrolling tables;
- dialogs become bottom sheets where appropriate;
- touch targets at least 44px;
- actions never rely on hover;
- study submit remains visible above the keyboard;
- source passages and feedback remain readable without horizontal scrolling.

Test the entire product at 375px, 768px, 1024px, and 1440px.

## 17. Accessibility

- Body text and controls meet at least WCAG AA contrast.
- Focus rings are burgundy with sufficient contrast and a visible offset.
- Every icon-only control has an accessible name.
- All fields have real labels.
- Status changes and grading feedback use appropriate live regions.
- Semantic color always has text.
- Study flow is fully usable by keyboard.
- Multiple-choice options use correct radio semantics.
- Dialog focus is trapped and restored to its trigger.
- Headings follow a logical document hierarchy.
- Charts have concise textual summaries.
- Motion honors reduced-motion preferences.
- Serif display type is never used so small that readability suffers.



## 18. Content voice

Marginalia speaks like a thoughtful tutor and careful editor.

Voice:

- concise;
- calm;
- specific;
- honest about uncertainty;
- encouraging without false praise;
- never childish, corporate, or mystical.

Preferred:

- “Marginalia is reading page 18 of 42.”
- “Your response is safe. Try grading again.”
- “Two topics need another pass.”
- “This question comes from page 14.”

Avoid:

- “Oops! Something went wrong!”
- “AI magic is happening…”
- “Amazing job!!!”
- “Unlock your learning potential.”
- “No data available.”

Use sentence case for buttons and headings. Use uppercase only for short editorial metadata labels.

## 19. Implementation acceptance checklist

The design is not complete until all of the following are true:

- The product is immediately recognizable as Editorial Academic, even with all content removed.
- Serif typography is used consistently for editorial content and sans-serif for interface content.
- Warm ivory, ink, burgundy, and hairline rules define the system.
- No screen resembles a generic grid of rounded SaaS cards.
- Library clearly recommends the next study action.
- Empty Library teaches upload without a tour.
- Document processing names every active step and can recover from failure.
- Every generated question visibly links to its source page.
- Study presents exactly one question as the dominant element.
- A failed grade never loses the student’s answer.
- Feedback remains beside the submitted answer for comparison.
- Progress puts weakest topics first and pairs every color with text.
- Every async flow has loading, empty, error, and retry behavior where relevant.
- Destructive actions explain their consequences.
- Desktop and 375px mobile both feel intentionally designed.
- Keyboard-only study is complete.
- Dark mode retains the warm archival character.
- Product copy follows the specified voice.

When details are not specified, extend the system using the same principles: editorial hierarchy,
warm paper surfaces, serif content, sans-serif controls, burgundy action color, fine rules, minimal
elevation, and a calm academic voice.