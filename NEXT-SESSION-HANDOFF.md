# Current checkpoint — November 20, 2026

This checkpoint supersedes historical pending-status notes below. Reusable transfer passed live acceptance on Julian Playground - ChatGPT (four links, three assessment flags). Receipt-owned cleanup is implemented and simulation-tested, but live cleanup was deferred by the user. Companion is 0.6.0; user reports reloading it. Full workspace backup/restore is implemented and browser-tested, opening an isolated workspace without replacing the original. All 128 regression tests pass. No live cleanup was performed. Next development: broaden reviewed transfer beyond existing-level links while retaining exact approval, preservation and recovery safeguards.

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
