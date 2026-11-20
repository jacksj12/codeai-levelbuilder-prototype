# Release delivery boundary

Release 0.10.2 code and tests committed as 641e673. Push is pending: Git Credential Manager waited for interactive authentication; a noninteractive retry confirmed credentials unavailable. No remote success claimed. Restore GitHub sign-in, then push the local tested commits.

The retained isolated native editor contains the exact reviewed unsaved proposal. Private exact review: AI-Lab-save-ready-review.md; evidence: native-teaching-rehearsal-evidence.json; screenshots: native-teaching-review.jpg and native-teaching-review-full.jpg, all in the original Documents/ChatGPT workspace. This is a native UI save review, not an approved companion request. Before any user-approved native Save and Keep Editing, compare current staged values and fresh saved baseline again. Live save approval is still absent.

# Current checkpoint — 0.10.2 hardening and native staging

This checkpoint supersedes the historical status sections below. The regression suite passes all 168 tests. The native-shaped browser fixture “Check new activities and existing-section callout” passed and restored its complete baseline using modern dialog handling, with saved=false and zero lesson Save controls invoked. Companion 0.10.2 recognizes modern alertdialog removal confirmations, refuses existing-callout edits when a section contains multiple callouts until native targeting is verified, and checks saved existing-section links for exact order, active identity, variants and all supported flags. The guard blocks the whole unsupported batch before staging a valid prefix. Cleared-baseline tests confirm documented null-to-empty editor defaults without weakening outside-edit checks.

Direct authenticated native browser rehearsal completed 3 activities, 10 sections, 6 callouts and four exact existing level links. Their assessment flags are false, true, true, true. Exact DOM comparison found zero differences against the scoped package across all activity titles/timing, all ten section titles/timing/remarks/body, five front-matter fields and all six callout type/body dialogs. All four existing-level edit pages confirmed exact names and only official-source-unit usage, with no playground conflict. The current script[data-lesson] raw saved baseline exactly matches the pre-rehearsal baseline. No live save has been approved or attempted. The unsaved native tab is retained for the user’s exact approval; private screenshots and evidence are outside Git in the original workspace. Extension automatic end-to-end preparation remains unverified, and live saved acceptance and live cleanup remain unaccepted.

The user authorized a two-hour delivery effort, use of sub-agents, and frequent tested commits/pushes. Exact approval is still required before a live lesson save. Do not treat the deadline or permission to ship code as live-save approval.

# Preparation diagnostic fix — 0.10.1

The user reported switching to the editor with a disabled report button. Their screenshot showed the clean-saved-baseline refusal before rehearsal, not a hung save. Root mismatch remains unknown. Preparation now retains read-only baseline evidence before validation, reports exact differing normalized field paths or capture blockers, enables report download on checkpoint, retains the error in exported evidence, and returns focus to the review tab if the editor remains active. All 162 tests pass. User must reload the companion/review page (not the lesson editor), run preparation again, and retain the automatically downloaded report. No live changes were staged by the reported failed attempt; no save was attempted.

# Latest checkpoint — activity transfer

Companion 0.10.0 adds append-only activities and callouts on existing sections; 160 automated tests pass. Native-shaped browser restoration passed with zero lesson saves. Combined browser simulation saved once, verified, reloaded and rechecked without resend. See prototype/ACTIVITY-TRANSFER-ACCEPTANCE.md. The selected live lesson is now cleared; private scoped package and baseline are in the original Documents/ChatGPT workspace. The user confirmed they can reload/open the Edge companion. Fresh native preparation and unit-use checks are still required; no save-ready live review or live approval exists yet. Do not confuse the synthetic preflight with native rehearsal.

# Current checkpoint — November 20, 2026

This checkpoint supersedes historical pending-status notes below. Companion 0.9.0 supports reviewed teaching fields, existing callout type/text, append-only sections with five callout types, and verified existing levels in both existing and new sections. All 153 regression tests pass. Native-shaped callout editing/restoration passed in the browser with zero lesson saves. The combined browser simulation reviewed six field changes, a new section/five callouts and four links, then verified one transfer and one separately approved cleanup; reload/recheck did not resend. Cleanup preserves teaching changes and new sections. No live lesson was changed. Teaching/structural saved acceptance and live cleanup remain pending. New callouts on existing sections, new activities and shared collections still need mappings. The user has now selected the accepted lesson for review preparation only; see the latest destination update below.

# Lesson Studio — next-session handoff

Updated November 20, 2026. This is the current checkpoint; older acceptance documents contain historical stages.

## Completed and accepted

The user inspected the saved playground lesson and said “looks good.” The final four original level links were saved through the authenticated native companion, with HTTP 200, and independently verified after a fresh editor reload. Three links are assessments. All other saved content, settings, resource/objective/vocabulary associations and the playground title were preserved. No new level copies were created. Official source lessons remain read-only.

Destination: https://levelbuilder-studio.code.org/lessons/8898985/edit
Visible lesson: https://levelbuilder-studio.code.org/courses/6-12-dev-playground/units/16/lessons/11
Canonical alias: https://levelbuilder-studio.code.org/s/scottsdale-levelbuilder-exploration/lessons/11/edit
Title: Julian Playground - chatGPT Lesson 16: AI Lab
Counts: 3 activities, 10 sections, 6 callouts, 3 resources, 4 level links, 3 assessments.
New saved association IDs: 397256–397259. Existing level IDs: 104255, 104271, 104272, 104273.

The first save returned HTTP 500 and saved nothing: all four levels were already linked in Julian Playground - Claude in the same unit. Code.org prevents new duplicate levels within a unit. The user freed those links, all four were independently checked, and a separately identified authorized attempt succeeded. Preserve both receipts. Never blindly retry a request with an unknown outcome.

## Repository and running previews

Working directory: C:/Users/Jackson Work/Documents/GitHub/codeai-levelbuilder-prototype
Remote: https://github.com/jacksj12/codeai-levelbuilder-prototype
Current branch: main. November 20 follow-up work is uncommitted; the prior accepted checkpoint is 1b86d7e. The user explicitly requested this Git checkpoint and push. Check Git status/log to identify the resulting commit; do not infer that every future change is approved for commit or push.

Run from prototype with npm start. Node.js is required; no dependencies or API keys are required. Regression command from repository root: node --test --test-isolation=none. Latest result: 111 passed, 0 failed.

Existing previews: port 43829 serves the main local review app from this clone; port 43830 was used for isolated tests. Verify the served folder before relying on either. Older ports 4316/4317 may belong to older sessions or the backup folder. Do not stop unrelated servers.

The original Documents/ChatGPT/AI Build Day - LevelBuilder Prototype folder is a backup, not the working checkout. The GitHub connector previously authenticated as a different account from the private repository owner; do not assume it can push this repository. Prefer the configured Git remote and existing credentials.

## Implemented behavior

- Preview-first local review, flags with descriptions, focused edit navigation, overall local approval and visible blockers. Objective reordering is equivalent; real content changes invalidate approval.
- Level Builder-style local insertion controls: Level, Callout (all five types), Code Doc, Resource, Slide, Image and Activity Section. Live shared-resource/image creation is not connected.
- Structured package comparison and bounded local/native staging. Native support includes existing text, whole-minute timing, remarks, append-only sections/callouts and verified existing levels in empty progressions.
- Preserved unmanaged native settings/identities; full-plan capability checks; guarded interruption recovery; resume and duplicate-free reruns; outside-edit protection.
- Edge companion installed and live-tested. Automatic verification covers 12 field classes, temporary section/all five callouts, and the approved level-link flow. It runs in a separate tab. A 15-second timeout and target activation handle browser freezing; discarded tabs are refused.
- Narrow save-review builder/transport: complete destination payload, raw originalLessonData concurrency guard, exact request approval, fresh saved read, native staging checks, unit-level duplicate preflight, durable receipt before one PUT, independent saved readback, no automatic resend after ambiguous results.
- A new attempt after a rejected save requires explicit user authorization plus confirmed unchanged saved data. The user authorized the successful new attempt after freeing the original levels.
- The separate prototype/api-companion extension remains a GET-only comparison tool. Do not confuse it with the parent native companion.

This does NOT establish a general-purpose one-click importer or publisher. The live API save acceptance covers the four-level-link request; other native field/structural mutations have been verified unsaved.

## Private files and restore points

Do not commit private capture/review/job JSON. Git ignores prototype/browser-fill/accepted-rehearsal.json and local-save-*.json. The bundled default revision uses ordinary unsaved verification, not an armed approved-save job. A clone does not contain the personal review package or save authorization.

Local approved source export: C:/Users/Jackson Work/Downloads/lesson-review-package (1).json (read-only).
Private evidence directory: C:/Users/Jackson Work/Documents/Lesson Studio Checks/
Important files: approved-save-status.json, approved-save-success-receipt.json, approved-save-first-attempt-receipt.json, approved-save-restore-point.json, after-save-restore-point.json, confirmed-four-links-saved-raw.json and code-restore-point-approved-save/.
Successful download: native-automated-verification (17).json in Downloads.

Automatic continuation stopped after success. The native editor that was already open in Edge can have an old client baseline because the save used a direct request. Reopen/reload the saved editor before subsequent manual editing. Do not discard unknown outside edits to do that. Restore a saved lesson only through a new request prepared from its CURRENT baseline; never replay an old originalLessonData snapshot.

## Next work, in priority order

1. Reusable workflow implemented locally (November 20 follow-up): companion 0.5.0 adds explicit canonical practice-destination confirmation, package-file loading, fresh read, rehearsal/restore, proposed-change review, exact approval, one save and independent verification. The new path does not use the private bundled job files. Isolated workflow.html demo is browser-verified, including readback-only recheck and reload. All 111 regression tests pass. Still pending: live acceptance on a separately authorized practice destination; do not use the accepted lesson for replacement tests.
2. Expand saved transfer support beyond the four-link case. Existing text/structural operations are live-verified unsaved, not general saved acceptance. Objectives, vocabulary, resources, Code Docs, images and other unsupported structures need mappings and preservation checks.
3. Reduce manual extension reloads; synchronize the native editor baseline after a successful save without overwriting outside edits. Improve progress/recovery presentation.
4. Direct authenticated Slides/Notion source import and complete destination-aware revision handling. Current source import expects normalized JSON, and review exports do not restore a whole workspace.
5. UI polish, intentionally deferred by the user. Keep controls understandable and label Status and Run report clearly.

Do not rerun destructive or replacement tests against the accepted saved lesson. Use owned temporary changes and guarded cleanup; maintain restore points. Shared resources persist independently and changes can affect other lessons.

## Sprint demo follow-up

Use http://127.0.0.1:43829/workflow.html. Load demo lesson → prepare review → inspect four links / three assessments → approve simulated save → verify and recheck without resend. This demo uses synthetic destination data and no live writes. It has separate per-run browser storage; existing workspace data and evidence keys are retained. See prototype/README.md for the walkthrough. The user explicitly approved expanding to practice destinations they select and confirm they own; official sources remain read-only. Automatic approval review initially blocked an unconfirmed broadening; after explicit user approval, each selected-destination injection now requires practice confirmation and exact URL/identity checks. No automatic watcher revision was changed and no live lesson or restore evidence was modified.

## Autonomous execution — explicit user preference

The user explicitly requests that the next agent automate the work end to end and not make them repeatedly prompt, click, relay status, or authorize routine continuation. Treat this as a persistent working preference.

- Continue the authorized development cycle: inspect the current state, implement the next scoped milestone, test it, fix failures, verify the result, and update this handoff. Do not stop after each small task to ask whether to proceed.
- Automate preparation, local checks, evidence capture, recovery reports and repeat-test cleanup wherever supported. Preserve exact-change approval for live lesson saves; automation is not blanket authorization for new remote writes.
- Use existing context, repository evidence and available tools before asking the user. Do not request information already recorded or repeat completed acceptance steps.
- Ask only when required: a consequential action lacks authorization, a material product decision cannot reasonably be inferred, access is unavailable, or a genuine blocker cannot be resolved independently. Finish all independent work first and ask one concise question or request the minimum user action, explaining why it is necessary.
- Give concise progress updates for meaningful results or blockers without turning updates into permission requests. Do not ask the user to monitor progress or relay statuses that available tools can inspect.
- Keep working within the active session until the authorized outcome is finished or a concrete blocker requires input. Never claim work is running in the background after ending a turn, and never describe a locally tested feature as live-accepted.
- Keep the accepted live lesson unchanged unless its exact proposed changes are authorized. Live cleanup remains unaccepted; preserve that distinction while continuing unrelated development.

## User expectations

Continue authorized work without repeatedly asking to proceed. Ask only for a real missing decision or action unavailable through the tools. Be precise about local tests, live unsaved checks and saved verification. Never claim background work continues after ending a turn. The user permits additional agents/sessions if useful; create a user-owned new chat only when explicitly requested. Do not switch models without authorization.

Browser access: use CUA for browser interaction. Only IAB was exposed to agent controls; Edge was not directly controllable. The user-operated installed extension and its revision watcher performed Edge automation. Do not use shell/CDP/Playwright outside CUA to bypass that limitation. Do not expose CSRF/session values in artifacts or logs.

Detailed evidence: prototype/NATIVE-SCALAR-ACCEPTANCE.md, PREVIEW-REVIEW-ACCEPTANCE.md, TRANSFER-REHEARSAL-ACCEPTANCE.md, browser-fill/README.md and LEVELBUILDER-INTEGRATION.md. The planning Google Doc was not updated. The preserved engineering tests are not independent curriculum acceptance.

## November 20 MVP continuation

Main preview now emphasizes reading, flagging and approval; editing and insertion remain in the existing editors. Guided resource fields preserve metadata and validate audience/HTTPS constraints. Shared palette/readability improved. Transfer startup preserves malformed/unreadable evidence and blocks controls; storage writes return actionable recovery errors. Review expiry is now visible and disables stale approval; current step is programmatically indicated. Browser demo after storage hardening passed prepare, simulated save, reload and readback-only recheck with exactly one simulated send. No new live lesson save. Live acceptance still requires a separately confirmed practice destination and exact-change approval.
## Repeat-test cleanup requirement

Confirmed November 20, 2026: the user wants the testing workflow to handle removing prior test level associations instead of repeatedly requiring manual unlinking.

Implement a reviewed cleanup phase before the next transfer: identify exact conflicting associations and their owning practice lesson; match them to retained test receipts/restore points; show the proposed unlink changes; preserve unrelated content, assessment settings and identities; retain a fresh backup; obtain exact-change save approval; unlink associations only (never delete underlying levels); independently verify saved removal before retrying preparation. Unknown or externally created associations require an explicit ownership decision. Ambiguous saves must not be automatically resent. This authorizes building the cleanup workflow, not blanket deletion across lessons.

Current implementation still detects duplicate usage and has unsaved owned-staging cleanup. Saved cross-lesson cleanup is not implemented. Prioritize this workflow before repeating further live transfer tests that would require manual unlinking.

## Transfer automation follow-up

Verified downloaded live receipt for Julian Playground - ChatGPT: saved-and-verified, four existing level links, three assessments, no retry. Receipt remains private in Downloads. The source package for this test explicitly preserves destination resources and guidance.

Implemented automatic preparation after package load and practice confirmation, automatic readback-only recheck after a verified save, and automatic evidence downloads on completed saves or failed runs with checkpoints. Browser demo verified one simulated send, automatic recheck and actual report download. All 115 regression tests pass. These changes require the installed companion to reload before Edge uses them. Saved cross-lesson cleanup remains pending and must not be represented as implemented. No extension permissions were expanded.

## Reviewed test cleanup — November 20 follow-up

Companion 0.6.0 implements receipt-owned saved-link cleanup. After verified transfer it automatically prepares the exact removals. Cleanup requires separate approval, persists recovery evidence before dispatch, sends at most once, verifies fresh saved data, rechecks without resend, and downloads the report automatically. Imported successful reports support earlier runs. Only unchanged associations from the verified test receipt are removed; underlying levels and unrelated saved content remain. Changed links, outside unsaved edits, stale reviews, and unreadable evidence block dispatch. Native editor refresh is guarded against outside edits.

The complete simulated transfer/cleanup/reload/recheck cycle passed, with exactly one cleanup request and verified restoration. Deduplicated local storage retains complete recovery evidence and reads legacy records. This supersedes earlier statements that saved cleanup is unimplemented. Native cleanup is implemented but has NOT been live-accepted; no live links were removed by this change. Reload the installed companion once to load 0.6.0, then review and approve the exact cleanup on the owning practice lesson.

## Full workspace backups — November 20

The workspace footer now offers Download workspace backup and Open backup as separate workspace. This dedicated format preserves source, generated content, draft edits, baseline, review flags, conflicts, approval and pending resource text. Restoring validates the file and writes a new isolated workspace before navigating; the original workspace is not replaced. Review-package exports remain transfer documents, not workspace backups. Transfer receipts remain separate and are not included.

Verified actual browser download and file-picker restoration into a separate workspace. All 128 regression tests pass, including invalid formats, preserved pending edits, no overwrite and failed storage. User elected to move on from live cleanup testing; live cleanup remains unaccepted and existing live links remain untouched.

## Reviewed teaching transfer — November 20 continuation

Started from clean main at e7e021b (Clarify autonomous execution and required check-ins in handoff). Changes from this continuation are uncommitted; no commit or push was performed.

- Companion 0.7.0 supports saved transfer of teacher/student overview, purpose, preparation, assessment opportunities, existing activity/section titles and timing, section guidance and remarks. The package must remain locally approved; preparation only rehearses replacements and restores the editor. The final exact-request approval remains separate, with visible before/after values including intentional clearing. Destination lesson title stays preserved.
- New activities/sections/callouts and objective/vocabulary/resource collection mutations remain blocked before staging in the reusable saved workflow. The older unsaved structural tools remain available. Do not claim general structural saved acceptance.
- Mixed recovery first checks all owned fields, links and unrelated evidence; outside edits block restoration. Per-operation checkpoints are retained. Teaching-only requests skip level-usage checks and have no empty cleanup save. Mixed test-link cleanup preserves the reviewed teaching changes.
- Full regression: node --test --test-isolation=none => 135 passed, 0 failed. Seven new tests cover mixed/teaching-only transfer, exact approval, intentional clearing, readback preservation, unsupported whole-batch rejection, failed-prefix restoration and outside edits. Previous save/cleanup/backup tests still pass.
- Browser verification used a new server on port 43831, explicitly serving this repository's prototype/dist. Load teaching-text demo -> prepare -> inspect four before/after values -> simulated save -> reload -> readback-only recheck. One simulated request, four links, three assessments; automatic report download triggered. Existing previews were not stopped. No live browser or lesson was modified.
- See prototype/TEACHING-TRANSFER-ACCEPTANCE.md for scope and next checks. Installed companion has not been reloaded by this session; 0.7.0 requires a reload before live use. No automatic watcher job was changed and no private evidence was modified.

## Append-only structural transfer — November 20 voice-session continuation

The user correctly called out that no development was running after the prior final response. Development resumed in this active turn; do not imply background work after a final response. The user completed the teaching demo themselves. Do not send them through that demo again or point them to the old four-link package as a teaching-text package. No new destination-specific live package has been prepared.

Implemented companion 0.8.0: new sections can append to existing activities with title, guidance, timing, remarks and all five callout types. Exact review displays the complete appended section. New-section level links, mutation/appending of callouts on existing sections, new activities and shared collections remain blocked before staging. Source IDs and transient editor keys are never reused as persisted section IDs. Existing fields, sections, levels and other data remain protected.

Verified the public Code.org LessonActivity/ActivitySection implementations: missing section IDs create new records, sections are replaced from the supplied complete array, and tips contain type/markdown pairs. The request retains all existing sections and supplies only reviewed new records. This source inspection does not establish deployed live acceptance.

Nine new structural regression tests cover generated IDs, stable approval despite fresh staging keys, preservation, unsupported batches, lost removal acknowledgements, interrupted scalar recovery after section removal, multiple appends and teaching-only structures. Full suite: 144 passed, 0 failed. Browser simulation on port 43831 reviewed one new Evidence reflection section with five callouts, four teaching changes, four level links/three assessments, then saved once, verified, reloaded and rechecked without resend. Screenshot retained in the session visualization folder. No live editor was accessed or modified.

Updated prototype/STRUCTURAL-TRANSFER-ACCEPTANCE.md, README, popup wording and handoff. All work remains uncommitted; no push. The installed companion has not been reloaded in this turn. The full workspace backup behavior and private evidence were left intact. Link cleanup preserves added sections/callouts; it is not a whole-lesson undo.

## New-section levels and existing-callout edits — November 20 continuation

The user again requested active work after a prior completed milestone; development resumed rather than implying background execution. Companion is now 0.9.0. No installed-extension reload was performed.

- Verified existing levels can be linked in newly appended sections. Their IDs, assessment flags, order and supported native flags are explicit in the approved payload. Unit usage checks include both existing and new section groups. Readback refuses missing, reused or duplicated new association IDs across both groups, changed level identities and unreviewed flags/variants.
- Cleanup resolves new section identities from the verified saved receipt, removes only its owned level associations, and preserves the new section, callouts and teaching changes. Native cleanup validation and the simulator use the expanded ownership groups. Live cleanup remains unaccepted.
- Existing callout type and text now participate in exact before/after review, native staging, restoration and saved readback. The native dialog is located through mapped tooltip icons, and its original type/text must match before editing. Lesson content is checked again before dialog commit. Unmapped controls or outside edits block the action. Legacy scalar-only tooling still rejects callout changes before mutation; the reusable runner supports them.
- Source inspection used public Code.org ActivitySectionCardButtons, EditTipDialog and LessonTipIconWithTooltip. Native-shaped fixture browser test passed edited type/text and full restoration with saved=false and zero lesson Save invocations. This is not a deployed native acceptance test.
- Full suite: 153 passed, 0 failed. Browser broader demo passed six field changes (including existing callout type/text), new section/five callouts, four links/three assessments, one simulated save, one cleanup, and readback-only cleanup recheck after reload. The linked level in the new section is included in the displayed cleanup list.
- New notes: prototype/BROADER-TRANSFER-ACCEPTANCE.md. Existing documentation marks earlier scope as historical. All changes remain uncommitted. Private live evidence, accepted lesson, source package and backup behavior remain preserved.

No destination-specific live teaching/structural package has been produced: the earlier Downloads lesson-review-package (1).json remains only the four-link source package. Do not instruct the user to load it as the new teaching test. The next necessary live-preparation input is an owned practice lesson editor URL, followed by a fresh read and exact review. Do not claim work continues after a final response.

## Destination and Git authorization update

The user explicitly authorized using the accepted playground lesson for preparation of exact changes, with no live save until approval. A fresh read of its editor shows the title now ends in (Cleared), one blank activity/section, blank overviews and retained preparation. Do not assume the historical four-link baseline still exists. A local content proposal was generated from the existing approved AI Lab package outside this repository. Full transfer needs two new activities and a callout on the existing section, which remain blocked in the current save path. No native lesson fields were changed or saved. Fresh complete saved-baseline and unit-level checks are still required before an executable approval.

The user requests more frequent Git commits and pushes. Commit and push completed, tested milestones to the configured repository without repeatedly asking. Keep private lesson captures, source packages and destination reviews out of Git; live lesson approval remains separate.
