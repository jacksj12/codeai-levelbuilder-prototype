# CodeAI Level Builder: handoff for Claude

## Requested work

Update the existing [Build Day planning document](https://docs.google.com/document/d/1fUlHZTMrMMFLP0sBaWVclQ6c7y_as_Oj_7Mxby0VkU8/edit) with the user profile, use cases, verified field mapping, and proposed acceptance tests below. This request authorizes editing that planning document, not official lesson materials. Do not start implementation as part of this documentation task.

Read the existing document first. Preserve its useful content, tab structure, task owners, statuses, and links. Add clearly labeled sections for User Profile, Use Cases, Field Mapping, Acceptance Tests, and Open Decisions. Update the Overview, Polish UI, Front Matter Tooling, Documentation, and two-day plan where needed to match these requirements. Add test IDs to relevant tasks. Do not mark tests passed or tasks completed without evidence.

The current document recommends a webpage before completing field mapping. Treat that recommendation as provisional. Sequence requirements and expected-output approval before platform selection and implementation. Verify platform claims with current official documentation before relying on them; consult official OpenAI documentation on Codex and agentic development before making architecture recommendations. Do not install software, skills, or subagents merely because an existing document mentions them.

If you cannot edit the Google Doc, provide insertion-ready sections and identify the access limitation. Do not claim the document was updated. After an edit, read it back and summarize the sections changed, unresolved questions, and test approval status.

## User profile

- Primary users: CodeAI curriculum developers creating student-facing lessons, and professional learning developers/managers creating teacher-facing learning experiences.
- Job to be done: turn existing Slides speaker notes, Notion lesson briefs, and supporting resources into a complete, reviewable Level Builder lesson plan.
- Pain: developers reenter and reformat content that already exists, with opportunities for omissions, wrong resource links, and formatting errors.
- Technical experience varies. Minimize setup; provide clear errors and a documented first-use workflow. Operating systems and organizational sign-in approval constraints still need confirmation.
- Initial workflow: one lesson at a time, using pasted source links. Course discovery and batch processing are future scope.
- Success: complete front matter and Teaching Guide, accurate formatting and resource audiences, less manual work, and human review before any publishing. Some manual correction is acceptable initially.
- Support multiple curricula and lesson structures. CSP AI Lab is the first fixture; AI Discoveries and professional learning are later compatibility fixtures, not yet tested.

## Use cases

1. Create a complete draft: an author supplies a Notion brief and Slides link, then receives front matter, resource records, and an ordered Teaching Guide with source references.
2. Review transformations: compare sources and output side by side, with content and formatting changes highlighted and errors tied to a field or slide.
3. Add teaching guidance: edit output and add lesson-plan-only guidance without modifying the source deck.
4. Revise an existing lesson: compare incoming sources with the last approved output and current Level Builder content; resolve conflicts using Keep, Edit, or Remove. Never silently delete approved content.
5. Re-run without noise: previously approved content becomes the baseline and is not flagged again unless something actually changes.
6. Export or publish after review: provide field-specific copy/export outputs; any automated save must be restricted to the approved sandbox and separately authorized immediately before saving.
7. Evaluate Angelina's prototype: run tests against its actual supported functionality first, then report expanded requirements separately. Missing future features are not current bugs.

## Sources and safety

- [Official CSP Unit 1 Lesson 16: AI Lab](https://levelbuilder-studio.code.org/courses/csp-dev-2027/units/1/lessons/16)
- [Notion brief](https://app.notion.com/p/3f5e7b522e8480f98051c1f9693875bd)
- [Correct Slides deck](https://docs.google.com/presentation/d/1Uq3M1xk8vbSAK_dbuYGsZNkCsukRgWz9suP9u3vqx-I/edit)
- [Teacher exemplar](https://docs.google.com/document/d/13Bn4pgLQy54GzNzQTo10ONf79o5l5wU3Xc5KrSbyWFE/edit)
- [Student activity guide](https://docs.google.com/document/d/1ZGRldM4hbqjKx8V2KWWJQOk6Or0Darv9s7-K-EBf824/edit)
- [Codex independent prototype sandbox](https://levelbuilder-studio.code.org/courses/6-12-dev-playground/units/16/lessons/11)

The user assigned the sandbox above specifically to Codex after this handoff was first drafted. Claude and Angelina will use a separate sandbox; confirm their destination before any writes. The earlier Scottsdale sandbox is no longer the destination for Codex's version. All save-approval requirements remain in force.

Official lessons, the Notion brief, Slides, and activity guides are read-only. Even in the sandbox, obtain explicit authorization before saving. Reject official destinations regardless of URL alias or accidental user input. Opening an editor for inspection does not authorize changing its content.

Two tracks remain separate: Angelina's existing PowerShell prototype and an independent new tool. Her script and output were not available in the inspection session; no prototype execution or performance claim has been verified.

## Verified inspection findings — November 19, 2026

The authenticated official lesson and editor were inspected without edits or saves. The Notion brief and all 14 slides' speaker notes were read.

| Source | Destination | Verified behavior |
|---|---|---|
| Notion teacher overview | Overview Markdown | Separate from student overview; existing lesson omits the QOTD prefix but preserves question and prose |
| Notion student overview | Student Overview Markdown | Separate student-facing summary |
| Notion objectives | Individual objective records | Three objectives present; displayed order differs from Notion |
| Notion preparation | Preparation Markdown | One activity guide per pair |
| Notion links | Structured resources | Key, name, type, audience, URL; teacher resources use Verified Teacher audience |
| Notion vocabulary | Vocabulary records | Notion says n/a; lesson has no vocabulary records |
| Slides notes | Activities and activity sections | Ordered sections with title, duration, Markdown body, and Remarks checkbox |
| Teaching Tip labels | Attached callouts | Four teaching tips |
| Assessment Opportunity labels | Attached callouts | Two callouts; separate lesson-wide assessment field is empty |
| Transition instructions | Text plus level associations | Level 1 and Levels 2–4 have separate linked records and progression titles |

Lesson timing: Warm Up 5 minutes; Activity 35 minutes; Wrap Up 5 minutes. Activity subsections: Design Test Criteria 20, Test/Score/Reflect 10, Check for Understanding 5. There are ten activity sections across the three activities, including untitled sections.

Speaker-note mapping: slide 1 has no notes; slides 2, 6, and 12 introduce activity groups; slides 3–5, 7–11, and 13–14 supply the ten content sections. Teaching Tips occur on slides 3, 5, 8, and 9; Assessment Opportunities on slides 10 and 11.

Observed icon classes: goal → fa-solid fa-bullseye-arrow; discuss → fa fa-comments; discussion goal → fa fa-lightbulb-o; do this → fa fa-check-square-o; distribute → fa fa-file-text-o; circulate → fa fa-refresh; transition → fa fa-desktop. Preserve surrounding Markdown emphasis and lists.

Known discrepancy: the official resource labeled AI Lab Day / Slides points to the teacher exemplar document. The user confirmed that the actual Slides deck above is the intended destination. Record this as an expected-output correction; do not fix the official lesson during testing.

Purpose, vocabulary, standards, and the lesson-wide Assessment Opportunities field are empty. All ten Remarks checkboxes are unchecked. These facts do not establish that those fields are universally optional. The editor also exposes Announcements, Code, Opportunity Standards, JIT PL Concepts, and Tutor Deep Dive; their detailed behavior was not inspected. Save validation, limits, Remarks rendering, callout editing details, and publishing interfaces remain unverified.

## Proposed acceptance tests

These are proposed test specifications, not approved gold fixtures and not executed results. Obtain independent approval of exact expected outputs before using them as a release gate. Preserve approved fixtures; do not rewrite or weaken them to make implementation pass.

### Group A: evaluate existing prototype within confirmed scope

| ID | Input/action | Expected result |
|---|---|---|
| A1 Icons | Approved samples of the seven note markers above | Each marker becomes its approved HTML icon; adjacent wording remains intact |
| A2 Unsupported emoji | Synthetic note with an unsupported emoji amid instructional text | Remove only the unsupported symbol; preserve the instruction and report the removal |
| A3 Completeness and order | All 14 slides' notes | Every substantive note appears once in source order; empty/title/divider slides do not create invented instruction |
| A4 Markdown | Bold labels, italic prompt, paragraphs, and level list | Rendered output preserves emphasis, boundaries, and list meaning; no broken tags |
| A5 Transitions | Notes for Level 1 and Levels 2–4 | Correct lesson/level references preserved; no missing or changed level numbers |
| A6 Failure handling | Missing input, inaccessible source, malformed input | Clear actionable error; incomplete output is not represented as complete; original input remains intact |

First establish the prototype's supported input and output contract. For unsupported Group A behavior, report Not Supported or Not Applicable with the reason; classify a failure as a defect only when behavior is within its confirmed contract.

### Group B: expanded full-tool requirements

| ID | Input/action | Expected result |
|---|---|---|
| B1 Front matter | AI Lab brief and deck | Distinct teacher/student overviews, all three objectives, preparation, resources, and explicit no-vocabulary state; no fabricated purpose or standards |
| B2 Resources | Notion resource list and official baseline | Correct presentation URL; exemplar remains Verified Teacher / Answer Key; student guide remains Student / Activity Guide; no answer-key leakage |
| B3 Structure and timing | AI Lab speaker notes | Three activities, ten content sections, correct order; 5+35+5=45 minutes and 20+10+5=35 within Activity; no double-counting |
| B4 Callouts | Four tips and two assessment notes | Six correctly typed callouts attached to their source sections; no duplicate body text or relocation into the empty lesson-wide field |
| B5 Remarks | AI Lab plus a separate approved Remarks fixture | AI Lab stays unchecked; explicit Remarks fixture uses the correct section flag and verified rendering; no inferred Remarks from ordinary teacher guidance |
| B6 Level associations | Sections for slide 10 and slide 11 | Preserve actual linked level identities and progression titles; narrative links alone do not satisfy the structured association requirement |
| B7 Review | Generate and inspect the full lesson | Sources and generated fields visible side by side; formatting and content changes distinguishable; each generated field traces to a source or is labeled as proposed guidance |
| B8 Editing | Change generated prose and add lesson-only guidance | Changes appear in final export and remain preserved during subsequent regeneration; sources unchanged |
| B9 Conflicts | Approved baseline, changed source, and independently edited current lesson | Surface genuine conflicts with Keep/Edit/Remove; deletion requires an explicit choice; neither version silently wins |
| B10 Stable baseline | Approve output, then re-run unchanged inputs | No repeated change flags or duplicate records; new source changes flag only affected content |
| B11 Safety | Official URL, equivalent official edit alias, unrelated lesson, and sandbox URL | All non-sandbox writes blocked; sandbox save blocked until explicit authorization; no saves during read-only review |
| B12 Missing or conflicting data | Absent brief, inaccessible deck, contradictory objectives/timing | Identify affected fields and source conflicts; preserve known content; label incomplete draft; do not invent missing facts |
| B13 Compatibility | Later approved AI Discoveries and professional learning fixtures | Handle their real lesson structures and audience wording without hard-coded CSP assumptions; defer pass/fail until fixtures exist |
| B14 First use | Representative author follows documentation | Author can reach reviewable output with documented steps and understandable errors; record setup and completion time; approval threshold still to be set |

For B2, verify document identities, not only URL shape. For B9–B10, use a three-way comparison of approved baseline, changed sources, and current destination content. For B11, test the write guard with mocks first; do not prove protection by attempting a real write to an official lesson.

### Evaluation and bounded implementation loop

For every test record: ID, applicable track/version, fixture, approved expected result, actual result, pass/fail/not run/not supported, evidence, severity, and reviewer. Keep source defects separate from conversion defects.

Measure completeness and accuracy, elapsed execution time, token usage and estimated AI cost, manual correction/review time, failure severity, and installation/first-use friction. Define numerical release thresholds with the project leads; do not invent approved budgets or targets.

Before an autonomous implementation loop begins, set explicit limits on elapsed time, repair attempts, tokens, and estimated cost. Run approved tests, read failures, make targeted fixes, and stop when tests pass or any cap is reached. Report unresolved failures. Use deterministic transformations for straightforward parsing and formatting, and AI for interpretation where needed. Human review remains necessary for ambiguous instructional content.

## Decisions still needed

- Approve exact gold outputs, including objective order and treatment of the QOTD prefix. The resource-link correction is confirmed, but the complete baseline is not yet formally approved.
- Supply Angelina's script, current output, and supported-feature contract.
- Approve a Remarks example and fixtures for revision conflicts and later curricula.
- Confirm first-release export versus automated sandbox publishing scope.
- Confirm numeric time, attempt, token/cost caps and quality/usability thresholds.
- Confirm supported operating systems and organizational authentication constraints before platform selection.

Ask one clarification at a time only when needed. Complete the planning-document updates that do not depend on these decisions first.
