# Transfer comparison and local rehearsal — November 19, 2026

Later native existing-field work is documented separately in [NATIVE-SCALAR-ACCEPTANCE.md](NATIVE-SCALAR-ACCEPTANCE.md); the restrictions below describe this earlier local-rehearsal milestone.

This milestone adds a working comparison planner and a reusable runner against an isolated local DOM editor. It does **not** implement native Level Builder staging or saving. The accepted saved lesson, official sources, earlier approved downloads and main review workspace were not changed by the rehearsal.

## What is implemented

- `transfer.html`, reachable through Transfer review, loads an actual review export and checks approval, baseline consistency, conflicts, open issues and pending resource text. It does not regenerate the lesson from a fixture.
- The pure transfer core normalizes lesson content, compares destination evidence, and lists each proposed action with current and proposed values. Replacing a nonempty value, including clearing it, requires an exact-content keep/replace decision. Extra destination activities, sections and callouts are preserved and reported. Existing destination level associations are not implicitly removed when the proposal has none.
- Resource references map to a unique matching destination resource. Missing or ambiguous resources and level mappings block staging. The system does not create shared records. Embedded local images require verified destination asset URLs. Source lesson database IDs are never transferred into destination content.
- Objectives compare as exact-text multisets, so alphabetical order alone does not create a content change. Legacy zero section durations normalize to blank, consistent with the review editor and earlier accepted browser-fill behavior; activity duration zero remains numeric.
- Each plan contains content fingerprints, complete starting evidence, expected output and location-specific operations. The runner re-reads the entire destination before and after each action, including unrelated settings and mapping evidence. Outside changes stop the run. It never retries a changed value blindly.
- A recovery journal is stored separately from the lesson review workspace. Resuming reconstructs verified action prefixes from the actual current state; this handles a missing acknowledgement after an action without duplicating created records. A completed rerun performs no actions. Limits are 8 MB per package, 500 actions per plan and at most 500 actions per run, with a smaller user-selectable run limit and Stop control.
- Recompare current local editor preserves current edits and turns differences into new explicit decisions. Previous reports are retained in the downloadable history. A blocked run is shown as blocked rather than retaining a misleading previous success state.
- The local editor is a deliberately generic DOM test harness with visible location/action/value controls. It is **not a simulation of all native React selectors or dialogs**, and its synthetic resource/level catalog does not prove native mappings. The runner drives those controls and verifies their resulting DOM state rather than replacing the entire lesson in one assignment.
- An optional root-manifest browser extension captures current native editor DOM without making API requests or clicking controls. Capture is limited to the assigned editor aliases and verified lesson identity. Full saved evidence is retained alongside captured live fields, serialized activities/objectives and the resource table. Unknown live-state/vocabulary mapping remains an explicit blocker. Native staging and saving are absent from this extension.

The transfer core is separate from networking and can support a later API writer. The existing API companion remains its earlier read/compare implementation; this milestone does not complete API request mapping or authenticated tests.

## Executed engineering checks

`node --test --test-isolation=none`: **52 passed, 0 failed**. Sixteen new transfer checks cover approval and baseline restrictions; orphan grouping; wrong destinations; nonempty-content decisions; blank-field clearing; ambiguous/missing mappings; source edits; resource-key conversion; bounded interruption and resume; missing acknowledgements; duplicate-free completed reruns; outside edits; plan tampering; native write-adapter rejection; objective order versus missing/duplicate text; legacy section timing; preservation of extra destination records/settings; and native normalization/identity restrictions.

These checks establish the pure planner/runner behavior on engineering fixtures. They do not establish authenticated native browser acceptance.

## Executed local browser rehearsal

The actual earlier approved `lesson-review-package (1).json` was loaded, including its user-edited title **Lesson 16: AI Lab** and approved baseline. The file was read-only and was not replaced. The first load action timed out in the browser-control connection, but the page had received it; the resumed inspection confirmed the loaded package and prepared rehearsal before any retry.

1. Built an isolated synthetic destination and comparison: 51 actions, zero content decisions and zero approval/mapping blockers. The earlier preliminary 58-action count included seven legacy zero-minute values; normalizing their existing blank-display meaning removed those seven unnecessary actions.
2. Ran with a nine-action limit: the report displayed 9/51 verified, stopped safely, and identified Activity 1 / title as the next location.
3. Reloaded the page and resumed the retained comparison. The local editor reached 51/51 with three activities, ten sections, six callouts, three resources, four level links, seven blank section timings and the unrelated fixture setting unchanged.
4. Reran the completed plan. Counts stayed unchanged and the report remained staged-unsaved. No records were duplicated.
5. Changed the local destination title outside the plan using the harness controls. The next attempt stopped as blocked and reported that the editor had changed; no overwrite occurred.
6. Recompared from the changed local editor. The title appeared as one explicit conflict. Keep destination retained the changed title and reported one intentional difference. A later fresh comparison and explicit Use approved draft decision restored the approved title while retaining all other content and the unrelated setting.

No native Level Builder page was filled, saved, or otherwise mutated during this milestone. The API companion and native-capture extension were not installed or live authenticated-tested.

## Remaining work and native gate

Native staging remains disabled. Implement and verify a separate DOM adapter against the deployed editor before enabling it. It must handle native default activity/section creation, collapsed panels, inline objective editing, all callout types, resource association search, level search/flags, and current unknown settings without API calls or save-capable controls. Complete live-state capture of vocabulary and inline/uncommitted form edits; do not substitute saved bootstrap data for unknown current state.

Use a separately authorized disposable lesson for native staging verification, preserving the accepted populated lesson. Repeat interruption, rerun, stale-page, mapping and full readback checks there. Shared-resource creation, asset uploads and lesson saving remain separate remote writes requiring authorization for concrete changes. API save integration is a separately tested later path.

Official read-only source evidence for current native serialization and controls:

- [Serialized current activities input](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/ActivitiesEditor.jsx)
- [Activity serialization and native default behavior](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/activitiesEditorRedux.js)
- [Current objectives input and inline editor](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/ObjectivesEditor.jsx)
- [Resource table columns](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/ResourcesEditor.jsx)
- [Native overview labels](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/TextareaWithMarkdownPreview.jsx)
- [Lesson bootstrap evidence](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/views/lessons/edit.html.haml)
