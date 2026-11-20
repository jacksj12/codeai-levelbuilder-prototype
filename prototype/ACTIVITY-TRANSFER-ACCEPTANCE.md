# Activity and existing-section callout transfer

Companion 0.10.0 — November 20, 2026. No live lesson save or cleanup has been performed.

## Scope

Append-only activities now include the native editor’s automatic blank first section. The planner fills that section and appends later sections without duplicating it. Exact review lists new activity names/timing, sections and all new callout text/type, including appended callouts on existing sections. Existing record IDs and all unrelated settings remain preserved. New activity/section IDs must be fresh, positive and unique on saved readback. Temporary editor keys are stripped from requests.

Recovery recognizes retained complete checkpoints, removes only owned appended structures, and refuses outside edits. Lost removal acknowledgements can resume. New callouts are identified by an exact captured suffix, not inferred from text alone. Existing callout metadata remains protected. Native removal rechecks current content and protection immediately before confirming. Shared resource/objective/vocabulary collection edits remain blocked.

## Evidence

160 automated tests pass. Seven new tests cover the full missing structure, one-time approval-bound save, cleanup preserving teaching structures, regenerated editor keys, corrupted IDs/content/settings, interrupted staging, lost removal acknowledgements, outside edits, and persisted null callout lists.

The native-shaped browser fixture created two activities and a callout on an existing section, then restored the complete original capture with zero lesson Save controls invoked. The browser test exposed an ambiguous nested confirmation; confirmation now matches only its own heading. The expanded browser workflow showed both new activities and the appended callout, simulated one verified save, and rechecked after reload without resending. These are local checks, not live acceptance.

## Source evidence

Verified Code.org sources on staging: ActivitiesEditor.jsx, activitiesEditorRedux.js, ActivityCard.jsx, EditTipDialog.jsx and dashboard/app/models/lesson_activity.rb. They establish blank first-section creation, generated editor keys, native activity controls, the nested callout removal dialog, and saved activity fields.

## Selected destination preparation

The user authorized preparing changes to the previously accepted lesson, without saving until exact approval. The current saved baseline is now cleared: one blank activity/section and empty resources/objectives. A private scoped source package preserves the current title and shared collections, proposes three activities, ten sections, six callouts and four existing links/three assessments. Local preflight against that fresh saved baseline succeeds with two added activities, nine added sections, one appended callout on the existing section and five existing-field changes.

The package and captured baseline are outside Git. The installed Edge companion must run the fresh native rehearsal and unit-usage checks before a save-ready review exists. The user confirmed they can reload/open it; native preparation has not yet been observed. No save approval is recorded.
