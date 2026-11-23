## Live preservation-save acceptance

Version 0.12.3 passed the installed companion unchanged-save test on lesson 8898984 on November 20, 2026: native acknowledgement, durable receipt, independent exact whole-lesson readback and automatic recheck without resend. All four original levels and three assessment flags were preserved. This scope does not establish live acceptance of arbitrary changes or cleanup.

## Release 0.12.2 unchanged save test

From a fresh reusable transfer screen, confirm the practice lesson and select **Prepare unchanged save test** without choosing a package. Inspect the preserved level/assessment counts and zero changes, check approval, then choose **Approve and save once**. It invokes the same native save path with no field edits. It records the attempt before dispatch, requires native acknowledgement plus exact whole-lesson readback equality, and never resends on recheck. Missing acknowledgement remains unconfirmed even if data is unchanged. No cleanup is needed or offered. Keep the original lesson tab open.

## Release 0.12.0 source imports

The popup now opens the lesson workspace and imports the current signed-in Google Slides deck read-only. The source reader exports only the selected presentation, validates its PowerPoint archive and speaker notes, then opens an explicit source review. It uses the same activeTab/scripting permissions. Combine it with a Notion Markdown export in the workspace. File imports and serialized reader checks pass; installed-extension execution is still awaiting permitted browser access. Browser policy currently blocks extension URLs, so this session did not reload the installed companion.

## Release 0.11.0 save behavior

New transfer reviews use the native editor's **Save and Keep Editing** control after the existing final baseline and capture checks. Approval binds this method as well as the intended content. The companion records the attempt first, clicks once, and independently rereads saved data. Missing acknowledgement never causes fallback or resend. Legacy reports retain their transport and remain readback-only after an attempt.

Load the updated `prototype` directory to install this release, preserving retained run reports. The agent did not reload the installed extension. Local serialized transport tests passed; a separately approved manual native save independently verified the four original levels in lesson 8898984. These are distinct acceptance results. No additional live save or cleanup is authorized by installation instructions.

# Native browser companion — setup and limits

The **Lesson Studio native companion** lives in the parent `prototype` folder. Its reusable transfer screen reads an owned practice destination, rehearses and restores supported changes, shows an exact review, and requires separate approval before one guarded save. It is distinct from the read-only `api-companion` extension and from the older bounded unsaved staging tools in this popup.

## Install or update

1. Run the local workspace with `npm start` from `prototype` when you need local editing/export or the isolated demo. The unpacked extension itself loads files from this checkout.
2. In Edge or Chrome extension management, enable Developer mode and choose **Load unpacked**. Select the **parent `prototype` directory**, containing `manifest.json`; do not select `browser-fill` or `api-companion`.
3. When updating this checkout, reload the installed extension and reopen its transfer screen. Current source version: **0.15.5**. Preserve/download any current evidence first. No private review package or save authorization ships in this clone.
4. Sign in to Level Builder normally and open the exact owned practice lesson's canonical editor: `https://levelbuilder-studio.code.org/lessons/ID/edit`.

No API key, copied credentials or additional host permissions are needed. Official source lessons remain read-only. A local package approval is not approval to save remotely.

## Read a selected practice baseline without a package

Open the selected canonical editor, launch **Open reusable lesson transfer** from its companion, confirm the practice URL and permission, then choose **Read baseline only and download report**. Leave the package picker empty. The message immediately beside the button shows the installed companion version at startup, current read progress, and any exact error. Download baseline report remains available for early read failures; if an automatic download does not appear, use that button. If the controls still say Loading companion controls or show an older version, close the transfer screen, reload the installed extension and open a fresh screen from the practice editor. It reads fresh saved data and the current editor and downloads private evidence; it does not stage changes, check unit-level usage or save. Stale baselines, unsaved edits and blockers remain visible in the report. The old popup read button stays restricted to its historical assigned lesson; use this new screen for another selected practice lesson.

## Prepare a reusable transfer

1. From the practice editor tab, open the companion popup and choose **Open reusable lesson transfer**. Keep the original editor tab open.
2. Confirm the exact practice URL and permission to edit it. Upload an approved JSON **review package** exported from Lesson Studio, not normalized source JSON or a workspace backup. Preparation starts automatically once both inputs are present.
3. Preparation compares fresh saved data with the open editor, checks supported mappings, stages changes temporarily, restores the complete original editor and checks level conflicts in the unit. Unsaved content/settings, stale saved baselines, unsupported operations and outside edits stop preparation.
4. Inspect every before/after value, new activity/section/callout and level association. Destination title and all unlisted content/settings/record identities remain preserved. Intentional clearing is shown explicitly.
5. Only when the exact changes are authorized, check the separate approval and choose **Approve and save once**. A restore point and durable attempt receipt must be stored before dispatch. The companion sends at most once, independently reads saved data, rechecks without resending and downloads the report.

An attempted run resumes as readback-only. **Check saved result again — no resend** does not retry a save. An uncertain outcome must never trigger a blind retry. Preserve any outside unsaved edits before reopening the native editor to synchronize its baseline after a verified save.

Supported reusable changes: overview/student overview, purpose, preparation, assessment opportunities; existing activity/section titles, whole-minute timing, guidance and remarks; append-only activities and sections; all five new callout types, including on existing sections; existing callout text/type in a section with one callout; verified existing levels in empty existing/new progressions with supported flags. Multi-callout targeting, objective/vocabulary/resource collection mutations, replacement of populated progressions and unsupported mappings block the whole batch before staging. The [main guide](../README.md) contains the capability table and synthetic demo walkthrough.

## Reports and interrupted preparation

Download the run report before changing or reloading an editor after an error. Baseline diagnostics identify normalized differing field paths or incomplete capture blockers. A failed run that owns unsaved changes exposes **Restore this run’s unsaved staging**; restoration verifies ownership and refuses outside changes. Keep both tabs and retained browser data until recovery is understood.

If storage fails, write controls pause and the current in-memory report remains downloadable. Save it, restore storage access and reload the same run. Do not clear browser data or start a new save. The report includes private curriculum, destination data, request details and restore evidence; keep it outside Git. It is not a full local workspace backup.

## Repeat-test cleanup

After a verified save with added links, the screen prepares exact receipt-owned removals. Imported successful test reports can also prepare cleanup on their owning practice destination. Cleanup requires a separate exact approval, stores recovery evidence before at most one dispatch, and verifies fresh saved data. Rechecks do not resend.

Only unchanged level associations owned by the verified test receipt can be removed. Underlying levels, teaching edits, appended activities/sections/callouts and unrelated data remain. Outside edits or ambiguous ownership block cleanup. This is not a whole-lesson undo. **Live cleanup remains unaccepted; do not run it on the accepted lesson for delivery testing.**

## Local demo and acceptance boundary

Run the local server and open `workflow.html`. **Load broader transfer demo** exercises missing activities, appended sections/callouts, teaching changes, four existing links and three assessments against a synthetic destination. Prepare, inspect, approve a simulated save, reload and recheck: one simulated save, no live requests. Controller regression checks cover that screen path and failed evidence storage. A fresh browser walkthrough was unavailable in the latest delivery session.

The latest accepted live result is the explicitly approved **native UI save** of the complete AI Lab proposal, independently verified after a fresh editor load with zero mismatches. It has three activities, ten sections, six callouts, four original levels and three assessment flags. The earlier restricted companion four-link save also passed live independent readback. These are separate from the reusable companion's automatic full path, which remains unverified end to end on the live site. No new live save or cleanup is authorized by this guide.

## Older tools and historical evidence

The popup's **Read / recompare current editor**, **Load review package**, mapping verification and bounded **Stage reviewed changes** use the older unsaved adapter. Their capability checks are narrower than the reusable screen; unsupported actions block the whole legacy batch. A small action limit, resume, duplicate-free reruns and per-operation evidence are retained. Staging itself does not save.

**Run automatic unsaved check and restore** opens a dedicated controller tab for existing fields and temporary section/callout checks. It temporarily changes the editor and restores only owned changes. It is not a read-only demo. The committed automation revision remains `verification-release-28`; no personal approved-save job is bundled or armed. Historical ignored accepted-package/save-job files must not be reused as general save permission. Do not run these tests on the accepted lesson during delivery.

`transfer.html` is a separate local comparison and synthetic DOM rehearsal tool; it does not publish. Its reports and storage differ from reusable transfer sessions. The API comparison extension under `api-companion` remains GET-only.

The newest [handoff](../../NEXT-SESSION-HANDOFF.md) supersedes earlier pending-status wording in dated evidence. Historical live unsaved checks, four-link save receipts, native-shaped fixture results and acceptance limits are retained in [native results](../NATIVE-SCALAR-ACCEPTANCE.md), [rehearsal results](../TRANSFER-REHEARSAL-ACCEPTANCE.md), [activity transfer](../ACTIVITY-TRANSFER-ACCEPTANCE.md) and related acceptance documents. Private evidence stays outside this checkout.
