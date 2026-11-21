# Shared-record live test passed — source 0.15.3

Companion **0.15.2** passed the user-operated live test on lesson **8898985**: both approved test records were verified, the two associations rehearsed and restored, and a separately approved native save independently verified with zero mismatches and no resend. Removing only those two associations from the saved readback reproduces the entire original lesson exactly. Protected lesson 8898984 was untouched.

Source **0.15.3** corrects stale preparation/recovery labels after a verified save while retaining historical evidence. Older successful reports normalize when opened; unconfirmed runs retain their recovery state. No immediate companion reload or repeat save is required. The broader unsupported publishing scope remains unchanged. See [live acceptance and limits](../NEXT-SESSION-HANDOFF.md).

# Live reader repair — 0.15.2

**298 tests pass.** The first shared-record live check safely stopped before creation because the reader expected `data-unit-for-lesson`; the deployed editor uses `data-unitforlesson`. Both serialized scope readers and their previously over-permissive fixtures are corrected. Reload the existing companion to 0.15.2 before retrying the same approved test package. No shared records or lesson save occurred in the failed attempt. Installed/live acceptance of the repaired path remains pending; the association save still requires its separate review. See [the handoff](../NEXT-SESSION-HANDOFF.md).

# Shared-record validation — 0.15.1

**297 automated tests pass, zero failures.** Completed the shared-review controller checks and serialized native search/association/reload checks deferred by 0.15.0. Fixed ambiguous same-label record selection and preserved expanded details and keyboard focus through approval and periodic refresh. The actual review screen passed a synthetic browser check, including a 390-pixel layout and no console errors.

Installed-extension acceptance of this new path is still pending. The user designated unit 16 / lesson 11 as disposable for testing; its native editor identifies lesson **8898985**, separate from protected lesson **8898984**. Browser policy blocks agent control of extension URLs. No new shared records, staging, save, cleanup, or protected-lesson changes occurred. Source is 0.15.1; installed version remains last verified at 0.12.3.

Read [shared-record validation](SHARED-RECORD-VALIDATION.md) for executed checks and the manual live-test handoff. Shared-record editing/deletion, saved-content removals, replacement/reordering of saved level links, assets and production destinations remain unfinished and blocked. Earlier release notes below are historical.

# Current implementation — 0.15.0 checkpoint

**287 tests pass; the full publishing build remains unfinished.** Shared resources and vocabulary now have separate create-or-reuse review, durable create-once evidence, read-only rechecks, schema-4 package binding and a separately approved lesson association save. Rehearsal restoration uses guarded reload rather than the native vocabulary Delete action, which deletes shared records globally.

New shared-record paths have simulated pipeline, serialized API-bridge and reload tests. Dedicated shared-button controller tests, serialized native search/association controls, rendered review and live acceptance are still pending. Installed companion was last verified at 0.12.3; source is 0.15.0. No protected lesson or saved level was changed.

Remaining work: shared-record editing/deletion, saved-content removals, replacement/reordering of saved level links, assets and production destinations. See [the current handoff](../NEXT-SESSION-HANDOFF.md) for exact next steps, preservation constraints and prior successful Notion/live verification evidence. Earlier notes below are historical.

# Current implementation — release 0.14.0

**274 tests pass.** Publishing now supports new objectives, explicit one-to-one mappings for multiple revised objective descriptions, progression title/assessment edits without replacing existing level associations, and editing a chosen callout in a section with multiple callouts. Objective readback follows saved IDs across the server's alphabetical sorting. Existing identities, tags and unreviewed fields are checked throughout rehearsal, recovery and saved verification.

The broader publishing build is still incomplete: shared-resource creation, vocabulary writes, saved objective/content removals, replacement/reordering of existing level associations, asset uploads and production destinations remain blocked. These guards were not removed. New release paths have automated control and pipeline coverage, not new live changed-save acceptance. The installed companion was last verified at 0.12.3; reload to 0.14.0 before a future reviewed changed publication. Explicit objective mappings use schema 3 so older companions reject them.

Live Notion sign-in/import and the earlier fresh visible-editor preservation check remain recorded in [NOTION-AND-PUBLISHING.md](NOTION-AND-PUBLISHING.md). The final approved private package still compares as already-matches: four levels, zero changes or blockers. No live lesson was staged or saved for this release. Run `npm start` at `http://localhost:4316`. Earlier release notes below are historical.

# Historical validation — release 0.12.4

The ten requested build/test passes are complete: **241 tests pass**. Read [TEN-PASS-VALIDATION.md](TEN-PASS-VALIDATION.md) for changes, real import checks and remaining scope. The installed 0.12.3 companion unchanged-save workflow previously passed with all four levels and existing content preserved. This release makes local import/revision changes only; no additional live save or cleanup was performed. Historical notes below describe earlier states.

# Lesson Studio — setup and delivery guide

The local workspace supports lesson preview, focused editing, described issue flags, one overall local approval, structured exports and full workspace backups. The native companion prepares a separate exact destination review before an explicitly approved save. The isolated demo exercises that transfer workflow using synthetic data.

## Run from this checkout

Requires Node.js. No dependency installation or API key is needed.

```powershell
cd prototype
npm start
```

Open [Lesson workspace](http://127.0.0.1:4316) or [Transfer demo](http://127.0.0.1:4316/workflow.html). If occupied, set `$env:PORT='43834'` before `npm start` and use the printed address. Verify that startup serves this saved checkout's `prototype/dist`. The separate Documents/ChatGPT project folder is an older backup, not the build destination. Browser storage is separate for each hostname and port.

From `prototype`, run `node --test --test-isolation=none`. The latest delivery check passes **297 tests**. The next paragraph records the earlier controller baseline; current shared-record coverage is described above. Six controller checks exercise the real transfer-screen handlers with a minimal DOM: broader preparation/save/reload/recheck, storage failure, failed durable attempt storage, reload after storage fails following dispatch, confirmed read-only baseline export for a selected destination, and real serialized saved-reader errors before any capture. A package check resolves the local dependency graph from the extension/demo entry points and checks the manifest and unarmed default mode. They are controller simulations, not browser or live acceptance.

## First use: review and export

1. Read the assembled Lesson preview. Use **Flag an issue** with a description, or **Edit** for focused changes; return to the same preview location.
2. Resolve flags, source conflicts and unapplied resource edits before overall local approval. Content changes invalidate approval; objective reordering alone does not.
3. Export Markdown for copying or a JSON review package for comparison/transfer. Review packages contain applied lesson records and review evidence; they do not restore a full workspace.
4. Use **Download workspace backup** before clearing browser data. **Open backup as separate workspace** validates the backup and opens an isolated workspace, preserving the original. Transfer receipts are separate from workspace backups.

**Import sources** expects normalized source JSON with stable unique slide IDs, slide numbers, notes and the optional metadata shown in its template. Source JSON and exported review JSON are different formats. Read-only signed-in Slides import is available through the companion; Notion OAuth import has live acceptance recorded in NOTION-AND-PUBLISHING.md. Regeneration preserves local edits when sources are unchanged and asks for choices on conflicts and incoming deletions.

Local insertion controls support Level metadata, all five callout types, Code Doc, Resource, Slide, Image and Activity Section. These local editing capabilities do not imply native transfer support. Shared-resource/vocabulary creation uses the separate reviewed companion path described above; image uploads remain unimplemented. The preview is an approximation of Level Builder rendering; native file-picker automation remains unverified.

## Delivery demo: no live writes

Open `workflow.html` on the running local server, or choose **Transfer demo** in the workspace. Use a fresh isolated run. For the fullest demonstration:

1. Choose **Load broader transfer demo**. It includes two missing activities, appended sections, a new callout on an existing section, teaching changes, and four existing level links.
2. Choose **Read fresh destination and prepare review**. Inspect the exact teaching before/after values, new activities, section/callout content and level links. Preparation restores the original synthetic editor; no save has happened.
3. Check the approval box, then choose **Approve and simulate save**. Show the verified result, four links and three assessments. One simulated request is sent; a readback-only recheck runs automatically and the report downloads.
4. Reload, then choose **Check saved result again — no resend**. The simulated request count remains one. **Start another isolated demo** retains the previous run and starts a new one.

The simpler **Load demo lesson** shows only missing level links. **Load teaching-text demo** adds four teaching changes. All three use synthetic saved data and mappings, with no authenticated writer. Local controller checks cover the broader path; this delivery session had no available browser control and did not perform a new visual walkthrough.

Optional **Repeat-test cleanup** separately reviews only receipt-owned level-link removals. In the simulation it keeps teaching changes, activities, sections and callouts. Cleanup is not a whole-lesson undo. Do not use it on the accepted live lesson.

## Native companion: current scope

See [installation and recovery](browser-fill/README.md). Load the parent `prototype` folder as an unpacked Edge/Chrome extension. The current source manifest is **0.15.1**; reload the installed extension after updating the checkout. No extra host permissions were introduced.

Before choosing a package, confirm the exact practice destination and choose **Read baseline only and download report**. This requires no package, captures fresh saved data and the open editor, and performs no staging, level-usage check or save. Keep the private downloaded report so the test package can be scoped to current content. Stale or unsaved content is reported without overwriting it.

From a selected owned practice lesson's canonical `https://levelbuilder-studio.code.org/lessons/ID/edit` tab, choose **Open reusable lesson transfer**. Confirm permission and the exact destination, then choose an approved review-package JSON file. Once both inputs are present, preparation starts automatically. Keep the original tab open. A clone contains no private live package or save authorization.

Preparation checks fresh saved data against the open editor, rehearses supported changes, restores the editor, and checks level usage in the destination unit. Review every proposed change before a separate exact-request approval. The save path records recovery evidence before at most one request and independently reads saved data. A retained attempt is rechecked without resending; uncertain outcomes must never be retried blindly.

| Reusable transfer supports | Blocks before staging |
| --- | --- |
| Overview, student overview, purpose, preparation, assessment opportunities | Shared-record editing/deletion and saved-content removal |
| Existing activity/section titles, whole-minute timing, section guidance and remarks | Reordering/removal of existing activities or sections |
| Append-only activities, sections and all five callout types | Unsupported native controls or mappings |
| Targeted existing callout text/type, including multi-callout sections | Unsupported or ambiguous native controls |
| Existing objectives with explicit identity mappings; append-only objectives | Saved objective removal or ambiguous identity mapping |
| Exact shared resources/vocabulary through separate create/reuse and association reviews | Shared-record edits/deletions or uncertain creation resend |
| Verified existing levels in empty progressions; existing progression title/assessment edits | Replacing/reordering populated progressions, unknown levels, unit conflicts |

Destination title, unlisted content, settings and existing record identities are preserved. Exact reviews include intentional blanks. The separate older bounded staging popup supports a narrower subset; capability blockers there apply to that path. The separate `api-companion` extension remains read-only.

If preparation stops, download the report before changing the editor. Baseline errors identify differing normalized field paths or capture blockers. Outside edits block restoration. If evidence cannot be stored, the screen pauses write controls and keeps a downloadable in-memory report; retain it and restore storage access before reloading the same run. Do not clear browser data or launch another save to recover.

## Historical acceptance notes (superseded by current validation)

The latest accepted live result is the user's approved **native UI save** on November 20, 2026. An independent fresh editor load verified all activity/section text, timing, remarks, both overviews and six callouts with zero mismatches: three activities, ten sections, six callouts, four original levels and three assessments. Original activity/section identities and all unreviewed saved fields were preserved. Earlier, a restricted companion four-link API save was also independently verified.

The reusable companion's **automatic complete preparation/save path remains unverified end to end on the live site**. Its expanded teaching/structural path has regression, simulation and native-shaped fixture evidence; the native UI save is separate acceptance. **Live receipt-owned cleanup remains unaccepted.** Preserve the accepted lesson; no new live save or cleanup is authorized for delivery testing.

Current source import and destination-aware revision support is described below and in TEN-PASS-VALIDATION.md. General production publishing, AI interpretation, shared collections/assets and cross-curriculum validation remain unfinished; standalone Notion OAuth is now live-verified. Tests are engineering checks, not independent curriculum signoff. Downloaded reports contain private source/destination content and restore evidence; keep them outside Git.

See the newest entry in [NEXT-SESSION-HANDOFF.md](../NEXT-SESSION-HANDOFF.md) for current state. Dated [activity](ACTIVITY-TRANSFER-ACCEPTANCE.md), [broader transfer](BROADER-TRANSFER-ACCEPTANCE.md), [teaching](TEACHING-TRANSFER-ACCEPTANCE.md), [native](NATIVE-SCALAR-ACCEPTANCE.md) and other acceptance notes retain historical evidence; their earlier pending-status statements are superseded by that handoff.

## Unconfirmed-save diagnostics (0.10.6)

Choose **Load unconfirmed-save demo** for a repeatable simulated HTTP-200 response that leaves saved data unchanged. Prepare, approve the simulation, reload and recheck: one request remains recorded, the result stays unconfirmed, and cleanup is unavailable. This demo does not contact Level Builder.

New native save attempts retain an allowlisted response summary, separately from independent saved verification. A successful HTTP status is never proof of persistence. Historical attempts without summaries cannot recover the original response retroactively. Readback recovery now clears an earlier read error after a successful fresh check.

Audit an existing downloaded run report offline, without changing it:

```powershell
node scripts/audit-transfer.mjs "C:/path/to/reviewed-transfer-report.json"
```

The audit verifies review integrity and recomputes saved readback checks. Output contains diagnostic facts, not the full private lesson or authentication data. It never resends or authorizes a request. Preserve original reports outside Git.

The historical direct-request failure remains unexplained. A later, separately approved native save successfully persisted all four original levels in lesson 8898984, independently verified with unrelated content unchanged. Version 0.11.0 defaults new reviews to that native editor handler and keeps verification independent. The installed companion was not reloaded in this session; the new serialized branch has local regression coverage, not installed-extension live acceptance. Never restart or resend the retained failed run.

## Local authoring and revisions (0.11.0)

In Teaching Guide, use **Add activity**, **Add section**, and **Move up / Move down**. Section moves stay within their activity. Blank timing and zero remain distinct. Reimporting unchanged source JSON preserves these additions and their order. All five callout headings are recognized in speaker notes.

Revised sources merge separate fields independently. Conflicting edits and blank text deletions appear in Revision review. Removing a source activity asks for one explicit decision covering its child sections, including local guidance. Keeping the group preserves it on later unchanged imports. Invalid orphan records block approval and backup import.

If two tabs edit the same local workspace, the later stale tab saves into a separate recovery workspace and updates its URL. Both drafts remain available. Export backups to preserve them outside browser storage.

## Import lesson sources (0.12.0)

Choose **Import sources**, then select one Slides PowerPoint export (.pptx) and one Notion Markdown (.md) export together. Google Slides presentation JSON and complete Notion blocks JSON are also accepted. The source summary shows slide/note counts and any unmapped headings or level mappings. Expand **Review or edit combined source details** when needed, then choose **Generate / compare changes**. Imports do not save to Level Builder.

Presentation files replace only slides; brief files update their recognized fields. Existing fields absent from a partial brief remain in the combined package. A complete normalized JSON source must be selected separately. Malformed or incomplete imports leave the existing package and draft intact. Unknown headings and identity changes remain visible warnings; source deletions require explicit revision decisions. PowerPoint exports do not reliably retain Google's original object IDs, so mappings are never guessed. Changed PowerPoint notes receive a new fallback identity; review the old/new sections explicitly.

In the updated companion popup, **Import this Google Slides deck** reads an already-open, signed-in Slides tab with the existing active-tab permission, then opens the workspace's source review. It changes no source content. If Google disallows the export, use File → Download → Microsoft PowerPoint in Slides and import that file. Notion uses Markdown or complete blocks exports; this release does not include standalone Notion OAuth sign-in. Connected Notion tooling was used to verify the actual source format, not embedded as an application backend.

Validation: 212 local tests passed; the actual source deck (15 slides / 14 notes) and connected Notion brief were imported together in the browser. Installed-extension execution remains unverified because the browser policy blocks extension pages. No new native save or cleanup was performed in this release.


Saved destination revision comparison is available in Revision review. Link a clean saved report matching the approved local baseline, then import later reports. Conflicts and deletion decisions remain local, and this feature makes no remote writes. Eight regression tests cover independent edits, conflicts, repeat imports, source refresh, deletion, identity stability, mismatched destinations, and unmanaged settings.
