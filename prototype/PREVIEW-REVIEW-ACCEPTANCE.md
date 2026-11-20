# Preview review milestone — November 19, 2026

Implemented locally in the cloned repository. No Level Builder or official source writes were performed. The earlier saved practice lesson and approved downloads were preserved. The original next-session handoff was copied to the repository root as historical context.

## Behavior

- Lesson preview is the default view, assembled from the current draft rather than regenerated source. It includes front matter, objectives, resources with types and audiences, grouped activities, section timing, callouts and level metadata.
- Each preview item offers Edit and Flag an issue. Flags require a description, retain their target, persist locally, and block approval. Open location displays only the affected existing editor card. Returning to the preview restores focus and scroll to that item. Source comparison is optional in the focused editor.
- Issues require explicit resolution; editing alone does not resolve them. Resolved issue history can be reopened. Content edits invalidate local approval and the affected optional review checkbox. Existing workspace data and approvals are retained on load.
- Overall approval no longer requires every individual checkbox. Open flags, source conflicts and unapplied resource edits remain blockers, each with a location button. Approval establishes a cloned local baseline and does not authorize remote saving.
- Pending resource JSON survives navigation and reloads. Invalid JSON cannot be applied or approved. Discarding it explicitly keeps the previously applied resource records.
- JSON exports retain the existing schema-version-1 lesson/source/baseline/conflicts fields and add review metadata for flags, optional review marks and pending resource text. Markdown exports retain applied lesson content.
- Objective comparison ignores order while retaining exact text and occurrence counts. An order-only source import or editor change preserves approval. Missing, duplicated or changed objectives are detected; source deletions require a decision. This is local source/draft reconciliation; the API companion still blocks on objective destination mapping.

## Executed checks

`node --test --test-isolation=none`: **36 passed, 0 failed** (15 existing checks, 7 review/objective checks, 3 section/callout authoring checks, and 11 insertion checks). The added checks cover approval/baseline isolation, issue validation, simultaneous blockers and storage serialization, preview content and escaping, and objective order/missing/duplicate/text comparisons.

An agent-operated local browser session exercised:

1. Default assembled preview, three resources, ten sections, six callouts and level metadata.
2. Rejection of an empty issue description; saved title flag disabling approval.
3. Open location showing one editor card, title editing, and the edited title appearing in preview while the flag remains blocking.
4. Explicit resolution, overall approval with zero per-item checks, reload retaining the edited lesson, resolved history and approval; reopening an issue blocks approval again.
5. Focused teaching-section editing; optional source display; a callout edit clearing its checked review box, invalidating approval and appearing in the assembled preview.
6. Invalid pending resource JSON retained through navigation and reload, application error shown, approval blocked, and explicit discard retaining the three applied resources.
7. An order-only objective source import reporting zero updates/conflicts and retaining approval; an order-only objective editor change also retaining approval.
8. Both JSON and Markdown downloads read back from disk, confirming edited callout text, full lesson content, local approval/baseline and resolved issue metadata in JSON. Only these two generated test downloads were removed afterward; earlier approved downloads were untouched.
9. Untitled-section issues labeled by slide, and Return to lesson preview restoring focus to that exact section.

The local test used `http://127.0.0.1:43829`, isolated from existing browser workspaces. Startup reported this clone's `prototype/dist` directory, and the served app module matched the on-disk file byte for byte. Ports 4316 and 4317 were occupied, so neither was reused or stopped. The server now accepts `PORT` and prints its served directory.

## Authoring follow-up from user review

Added Add teaching tip and Add assessment opportunity to each teaching section in both preview and editor. Add section after inserts within that section's activity; Add section on an activity appends to that activity. New sections have stable local identities and explicit local provenance, optional title/minutes, and required guidance. Adding content invalidates local approval. Canceling the dialog leaves the draft unchanged. Activity duration remains explicit and is not automatically changed by section minutes.

Three authoring regression checks verify additions through unchanged-source reconciliation, preview, storage and Markdown export, insertion order, and rejection of invalid additions without mutation. Local browser checks created a teaching tip in an existing section, inserted a new section immediately afterward, added an assessment opportunity to it, and reloaded to verify grouping, position and all new text. Blank callout content was rejected. These are local draft operations only; they do not save to Level Builder.

## Full bottom-row insertion follow-up

The six options from the supplied Level Builder screenshot are implemented at the bottom of each section in preview and editor, in the same order: Level, Callout, Code Doc, Resource, Slide and Image. Activity Section follows the row. These are local authoring controls, not a claim of full native Level Builder parity.

- Level adds name, number, Code.org URL and assessment metadata without copying database identities. New associations are marked as needing destination verification.
- Callout selects Teaching Tip, Content Corner, Discussion Goal, Assessment Opportunity or Ethics Opportunity.
- Code Doc inserts programming-expression Markdown from syntax, URL and optional color. The live catalog is not connected.
- Resource inserts an existing local resource reference or adds a local resource record and reference. Identical records are reused. Answer keys cannot use the Student audience. Pending raw resource edits must be applied or discarded first.
- Slide inserts the official slide icon marker in the section guidance, rather than adding a slide-deck record.
- Image accepts HTTPS or a local PNG/JPEG/WebP file up to 2 MB, with a description and expandable option. No file is uploaded remotely. Embedded images can increase export and browser-storage size; storage failures remain visible with the export-backup action.

Guidance insertions retain an active guidance-text selection when available, otherwise append without replacing existing prose. Preview supports safe links, resource references and images; JSON/Markdown retain the source content. The native picker automation stalled and expired before selecting a file, so the **file-chooser path is not end-to-end verified**. Recovery used an embedded PNG through the image dialog: it rendered with a natural width of one pixel and survived reload. This is separate from testing a picker selection.

Browser checks used a separate isolated workspace at port 43830, leaving the user's review workspace untouched. Checked Content Corner selection, Code Doc syntax/link/color insertion, reuse of Slides, local Handout creation, Slide marker insertion, new assessment level metadata, image rendering and reload. Reimporting unchanged sources reported zero updates/conflicts while retaining all insertions. A real downloaded review package was read back and verified for all six content kinds and all ten original sections; Markdown conversion retained each insertion. The generated test download and image fixture were removed; earlier approved downloads were preserved.

Official read-only implementation references inspected for this follow-up:

- [Bottom-row controls](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/ActivitySectionCardButtons.jsx)
- [Insertion syntax and level handling](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/ActivitySectionCard.jsx)
- [Callout types](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/templates/lessonOverview/activities/LessonTip.jsx)
- [Programming-expression Markdown](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/templates/lessonOverview/StyledCodeBlock.jsx)
- [Native remote image upload boundary](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/UploadImageDialog.jsx)

## Remaining limits

These are local review checks, not full [browser-fill acceptance](BROWSER-FILL-ACCEPTANCE.md), independent curriculum acceptance, or authenticated API tests. Rendering remains approximate with limited Markdown and icon placeholders. The existing source-deletion/grouping reconciliation limitations, multi-tab coordination and full workspace restore remain open. Review package restoration and rich-text fidelity need separate work.

Reusable browser filling, repeat-run/interruption recovery and API saving remain unimplemented. The API companion is read/compare only and has not been live authenticated-tested. No runtime AI calls or paid repair loops were added.
