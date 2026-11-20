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
Current branch: main. The user explicitly requested this Git checkpoint and push. Check Git status/log to identify the resulting commit; do not infer that every future change is approved for commit or push.

Run from prototype with npm start. Node.js is required; no dependencies or API keys are required. Regression command from repository root: node --test --test-isolation=none. Latest result: 101 passed, 0 failed.

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

1. Make the workflow reusable: destination selection, fresh read, proposed changes, review/approval, save and verification; remove dependence on a personal hard-coded job file and one fixed lesson.
2. Expand saved transfer support beyond the four-link case. Existing text/structural operations are live-verified unsaved, not general saved acceptance. Objectives, vocabulary, resources, Code Docs, images and other unsupported structures need mappings and preservation checks.
3. Reduce manual extension reloads; synchronize the native editor baseline after a successful save without overwriting outside edits. Improve progress/recovery presentation.
4. Direct authenticated Slides/Notion source import and complete destination-aware revision handling. Current source import expects normalized JSON, and review exports do not restore a whole workspace.
5. UI polish, intentionally deferred by the user. Keep controls understandable and label Status and Run report clearly.

Do not rerun destructive or replacement tests against the accepted saved lesson. Use owned temporary changes and guarded cleanup; maintain restore points. Shared resources persist independently and changes can affect other lessons.

## User expectations

Continue authorized work without repeatedly asking to proceed. Ask only for a real missing decision or action unavailable through the tools. Be precise about local tests, live unsaved checks and saved verification. Never claim background work continues after ending a turn. The user permits additional agents/sessions if useful; create a user-owned new chat only when explicitly requested. Do not switch models without authorization.

Browser access: use CUA for browser interaction. Only IAB was exposed to agent controls; Edge was not directly controllable. The user-operated installed extension and its revision watcher performed Edge automation. Do not use shell/CDP/Playwright outside CUA to bypass that limitation. Do not expose CSRF/session values in artifacts or logs.

Detailed evidence: prototype/NATIVE-SCALAR-ACCEPTANCE.md, PREVIEW-REVIEW-ACCEPTANCE.md, TRANSFER-REHEARSAL-ACCEPTANCE.md, browser-fill/README.md and LEVELBUILDER-INTEGRATION.md. The planning Google Doc was not updated. The preserved engineering tests are not independent curriculum acceptance.
