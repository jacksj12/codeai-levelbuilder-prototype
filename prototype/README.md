# Lesson Studio — setup and delivery guide

The local workspace supports lesson preview, focused editing, described issue flags, one overall local approval, structured exports and full workspace backups. The native companion prepares a separate exact destination review before an explicitly approved save. The isolated demo exercises that transfer workflow using synthetic data.

## Run from this checkout

Requires Node.js. No dependency installation or API key is needed.

```powershell
cd prototype
npm start
```

Open [Lesson workspace](http://127.0.0.1:4316) or [Transfer demo](http://127.0.0.1:4316/workflow.html). If occupied, set `$env:PORT='43834'` before `npm start` and use the printed address. Verify that startup serves this saved checkout's `prototype/dist`. The separate Documents/ChatGPT project folder is an older backup, not the build destination. Browser storage is separate for each hostname and port.

From `prototype`, run `node --test --test-isolation=none`. The latest delivery check passes **175 tests**. Six controller checks exercise the real transfer-screen handlers with a minimal DOM: broader preparation/save/reload/recheck, storage failure, failed durable attempt storage, reload after storage fails following dispatch, confirmed read-only baseline export for a selected destination, and real serialized saved-reader errors before any capture. A package check resolves the local dependency graph from the extension/demo entry points and checks the manifest and unarmed default mode. They are controller simulations, not browser or live acceptance.

## First use: review and export

1. Read the assembled Lesson preview. Use **Flag an issue** with a description, or **Edit** for focused changes; return to the same preview location.
2. Resolve flags, source conflicts and unapplied resource edits before overall local approval. Content changes invalidate approval; objective reordering alone does not.
3. Export Markdown for copying or a JSON review package for comparison/transfer. Review packages contain applied lesson records and review evidence; they do not restore a full workspace.
4. Use **Download workspace backup** before clearing browser data. **Open backup as separate workspace** validates the backup and opens an isolated workspace, preserving the original. Transfer receipts are separate from workspace backups.

**Import sources** expects normalized source JSON with stable unique slide IDs, slide numbers, notes and the optional metadata shown in its template. Source JSON and exported review JSON are different formats. Direct authenticated Slides/Notion import is unfinished. Regeneration preserves local edits when sources are unchanged and asks for choices on conflicts and incoming deletions.

Local insertion controls support Level metadata, all five callout types, Code Doc, Resource, Slide, Image and Activity Section. These local editing capabilities do not imply native transfer support. Live shared-resource creation and image uploads are not connected. The preview is an approximation of Level Builder rendering; native file-picker automation remains unverified.

## Delivery demo: no live writes

Open `workflow.html` on the running local server, or choose **Transfer demo** in the workspace. Use a fresh isolated run. For the fullest demonstration:

1. Choose **Load broader transfer demo**. It includes two missing activities, appended sections, a new callout on an existing section, teaching changes, and four existing level links.
2. Choose **Read fresh destination and prepare review**. Inspect the exact teaching before/after values, new activities, section/callout content and level links. Preparation restores the original synthetic editor; no save has happened.
3. Check the approval box, then choose **Approve and simulate save**. Show the verified result, four links and three assessments. One simulated request is sent; a readback-only recheck runs automatically and the report downloads.
4. Reload, then choose **Check saved result again — no resend**. The simulated request count remains one. **Start another isolated demo** retains the previous run and starts a new one.

The simpler **Load demo lesson** shows only missing level links. **Load teaching-text demo** adds four teaching changes. All three use synthetic saved data and mappings, with no authenticated writer. Local controller checks cover the broader path; this delivery session had no available browser control and did not perform a new visual walkthrough.

Optional **Repeat-test cleanup** separately reviews only receipt-owned level-link removals. In the simulation it keeps teaching changes, activities, sections and callouts. Cleanup is not a whole-lesson undo. Do not use it on the accepted live lesson.

## Native companion: current scope

See [installation and recovery](browser-fill/README.md). Load the parent `prototype` folder as an unpacked Edge/Chrome extension. The current manifest is **0.10.5**; reload the installed extension after updating the checkout. No extra host permissions were introduced.

Before choosing a package, confirm the exact practice destination and choose **Read baseline only and download report**. This requires no package, captures fresh saved data and the open editor, and performs no staging, level-usage check or save. Keep the private downloaded report so the test package can be scoped to current content. Stale or unsaved content is reported without overwriting it.

From a selected owned practice lesson's canonical `https://levelbuilder-studio.code.org/lessons/ID/edit` tab, choose **Open reusable lesson transfer**. Confirm permission and the exact destination, then choose an approved review-package JSON file. Once both inputs are present, preparation starts automatically. Keep the original tab open. A clone contains no private live package or save authorization.

Preparation checks fresh saved data against the open editor, rehearses supported changes, restores the editor, and checks level usage in the destination unit. Review every proposed change before a separate exact-request approval. The save path records recovery evidence before at most one request and independently reads saved data. A retained attempt is rechecked without resending; uncertain outcomes must never be retried blindly.

| Reusable transfer supports | Blocks before staging |
| --- | --- |
| Overview, student overview, purpose, preparation, assessment opportunities | Objective, vocabulary and resource collection mutations |
| Existing activity/section titles, whole-minute timing, section guidance and remarks | Reordering/removal of existing activities or sections |
| Append-only activities, sections and all five callout types | Unsupported native controls or mappings |
| Existing callout text/type where its section has one callout | Existing-callout edits in multi-callout sections |
| Verified existing levels in empty existing/new progressions, including supported flags | Replacing populated progressions, unknown levels, unit conflicts |

Destination title, unlisted content, settings and existing record identities are preserved. Exact reviews include intentional blanks. The separate older bounded staging popup supports a narrower subset; capability blockers there apply to that path. The separate `api-companion` extension remains read-only.

If preparation stops, download the report before changing the editor. Baseline errors identify differing normalized field paths or capture blockers. Outside edits block restoration. If evidence cannot be stored, the screen pauses write controls and keeps a downloadable in-memory report; retain it and restore storage access before reloading the same run. Do not clear browser data or launch another save to recover.

## Acceptance and remaining limits

The latest accepted live result is the user's approved **native UI save** on November 20, 2026. An independent fresh editor load verified all activity/section text, timing, remarks, both overviews and six callouts with zero mismatches: three activities, ten sections, six callouts, four original levels and three assessments. Original activity/section identities and all unreviewed saved fields were preserved. Earlier, a restricted companion four-link API save was also independently verified.

The reusable companion's **automatic complete preparation/save path remains unverified end to end on the live site**. Its expanded teaching/structural path has regression, simulation and native-shaped fixture evidence; the native UI save is separate acceptance. **Live receipt-owned cleanup remains unaccepted.** Preserve the accepted lesson; no new live save or cleanup is authorized for delivery testing.

Direct authenticated source import, complete destination-aware three-way revisions, general publishing, AI interpretation, shared collections/assets and cross-curriculum validation remain unfinished. Tests are engineering checks, not independent curriculum signoff. Downloaded reports contain private source/destination content and restore evidence; keep them outside Git.

See the newest entry in [NEXT-SESSION-HANDOFF.md](../NEXT-SESSION-HANDOFF.md) for current state. Dated [activity](ACTIVITY-TRANSFER-ACCEPTANCE.md), [broader transfer](BROADER-TRANSFER-ACCEPTANCE.md), [teaching](TEACHING-TRANSFER-ACCEPTANCE.md), [native](NATIVE-SCALAR-ACCEPTANCE.md) and other acceptance notes retain historical evidence; their earlier pending-status statements are superseded by that handoff.
