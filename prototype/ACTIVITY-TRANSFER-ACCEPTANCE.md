# Approved native save completed

The user explicitly approved the exact staged proposal ("It is ready to be saved"). On November 20, 2026, the agent rechecked the unchanged saved baseline and callouts, then clicked native Save and Keep Editing exactly once. An independent fresh editor load verified all activity/section text, timing, remarks and all six callouts against the scoped source package with zero mismatches. Both overviews match exactly. Only overview, studentOverview and activities differ at the top level from the baseline; all other saved fields are unchanged. Original activity and section identities are preserved.

Saved result: 3 activities, 10 sections, 6 callouts, 4 original existing levels and 3 assessment flags. New association IDs: 397404–397407; level IDs: 104255, 104271, 104272, 104273. The rendered lesson page independently shows the complete 45-minute teaching guide. Private evidence in the original Documents/ChatGPT workspace: native-teaching-saved-baseline.json, native-teaching-save-verification.json, native-teaching-saved-lesson.jpg. No retries or cleanup were performed.

This establishes the user-approved native UI save and saved readback for this proposal. The companion automatic end-to-end path and live cleanup remain separately unverified. A voice statement reporting a mismatch was incorrect; actual saved verification found zero mismatches and the user was corrected.

# Activity and existing-section callout transfer

Companion 0.10.2 — November 20, 2026. No live lesson save or cleanup has been performed.

## Scope

Append-only activities now include the native editor’s automatic blank first section. The planner fills that section and appends later sections without duplicating it. Exact review lists new activity names/timing, sections and all new callout text/type, including appended callouts on existing sections. Existing record IDs and all unrelated settings remain preserved. New activity/section IDs must be fresh, positive and unique on saved readback. Temporary editor keys are stripped from requests. Saved existing-section links are additionally checked for per-section ordering, a single exact level identity, active variant, variants payload and assessment/bonus/challenge/instructor/AI-analysis flags.

Recovery recognizes retained complete checkpoints, removes only owned appended structures, and refuses outside edits. Lost removal acknowledgements can resume. New callouts are identified by an exact captured suffix, not inferred from text alone. Existing callout metadata remains protected. Editing an existing callout in a section with multiple callouts is refused before any batch mutation because exact native targeting has not been verified. Appending a new callout remains a separate supported operation. Native removal rechecks current content and protection immediately before confirming. Modern confirmations using role="alertdialog" are recognized; open alertdialogs block ordinary reads/staging. Shared resource/objective/vocabulary collection edits remain blocked.

## Evidence

168 automated tests pass. The activity-transfer tests cover the full missing structure, one-time approval-bound save, cleanup preserving teaching structures, regenerated editor keys, corrupted IDs/content/settings, interrupted staging, lost removal acknowledgements, outside edits, and persisted null callout lists.

The native-shaped browser fixture created two activities and a callout on an existing section, then restored the complete original capture with zero lesson Save controls invoked. The browser test exposed an ambiguous nested confirmation; confirmation now matches only its own heading. The expanded browser workflow showed both new activities and the appended callout, simulated one verified save, and rechecked after reload without resending. These are local checks, not live acceptance. Added regression coverage confirms cleared null/default baselines, refusal of multi-callout edits before a valid prefix, and rejection of unreviewed saved link flags, variants, ordering or extra identities.

## Source evidence

Verified Code.org sources on staging: ActivitiesEditor.jsx, activitiesEditorRedux.js, ActivityCard.jsx, EditTipDialog.jsx and dashboard/app/models/lesson_activity.rb. They establish blank first-section creation, generated editor keys, native activity controls, the nested callout removal dialog, and saved activity fields.

## Selected destination preparation

The user authorized preparing changes to the previously accepted lesson, without saving until exact approval. The current saved baseline is now cleared: one blank activity/section and empty resources/objectives. A private scoped source package preserves the current title and shared collections, proposes three activities, ten sections, six callouts and four existing links/three assessments. Local preflight against that fresh saved baseline succeeds with two added activities, nine added sections, one appended callout on the existing section and five existing-field changes.

The package and captured baseline are outside Git. Direct authenticated native browser rehearsal has completed 3 activities, 10 sections, 6 callouts and four exact existing level links, with assessment flags false, true, true, true. Exact DOM comparison found zero differences from the scoped package for every activity title/timing, all ten section title/timing/remarks/body values, five front-matter fields and all six modal callout type/body pairs. The four existing-level edit pages confirm the exact names and only official-source-unit usage; no playground conflict is present. The fresh script[data-lesson] raw baseline equals the pre-rehearsal baseline.

The native-shaped browser fixture also passed-and-restored with the modern dialog fix, saved=false and saveControlsInvoked=0. Private screenshots and comparison evidence are saved in the original workspace outside Git. The authenticated unsaved tab remains open for the user’s exact approval. No live save has been approved or attempted. Extension automatic end-to-end preparation remains unverified; this direct native rehearsal and comparison is not live saved acceptance.
