# Lesson Studio — independent prototype

Latest verified milestone: the Edge native companion saved the four approved existing level links, including three assessment flags, and a separate authenticated reload verified the complete saved result. The user accepted the lesson. Existing native fields and section/callout appends also passed unsaved verification. General-purpose import and publishing remain unfinished. See [native acceptance results](NATIVE-SCALAR-ACCEPTANCE.md) and [current handoff](../NEXT-SESSION-HANDOFF.md).

The app now opens with an assembled lesson preview. Flag an issue with a description, open only that item in the editor, and return to the same preview location. One overall local approval replaces mandatory per-item checkboxes; flags, source conflicts and unapplied resource edits block approval with direct navigation. Each teaching section now has the Level Builder bottom-row options: Level, Callout, Code Doc, Resource, Slide and Image, followed by Activity Section. Callout offers all five documented types. Level adds local association metadata pending destination verification; Code Doc accepts syntax/link/color; Resource reuses a draft record or creates a local one; Slide inserts the Level Builder slide marker; Image accepts an HTTPS link or local PNG/JPEG/WebP file. Live catalog searches and remote image/resource creation are not connected. Each activity also offers Add section. New content is local, editable, reviewable and included in exports. Resource names, types and audiences appear above the advanced editor. See [preview review checks](PREVIEW-REVIEW-ACCEPTANCE.md).

Transfer review now checks an exported approved package and destination evidence, lists explicit content decisions, and supports a bounded local DOM rehearsal with interruption recovery. General native filling and publishing remain unfinished; a restricted explicitly approved existing-level save has passed live. The browser companion stages reviewed existing text/timing/remarks fields and append-only sections/callouts; unsupported activity creation, objectives, resource-association changes and replacement of populated progressions block its entire run. Verified existing levels can be linked into empty progressions. Use the Transfer review button or open `transfer.html`; see [transfer rehearsal results](TRANSFER-REHEARSAL-ACCEPTANCE.md). The optional [native transfer companion](browser-fill/README.md) reads current native DOM and stages supported fields and section/callout appends without API calls and is separate from the API comparison extension.

Two delivery versions now share the same lesson draft and review package:

- **Manual / no Level Builder API:** this local app, with editable review and copy/export for manual entry.
- **API comparison prototype:** `api-companion/`, an unpacked Chrome/Edge extension that reads the assigned saved lesson and compares it to the exported review package. No remote save is implemented; authenticated browser verification and destination mappings remain outstanding. See its README for setup and limits.

Run `npm start` inside this directory, then open http://127.0.0.1:4316. Requires Node.js; no packages or API keys required. Run `npm test` for engineering regression tests.

The first version includes the inspected AI Lab source snapshot. Review front matter, teaching sections, callouts, resources and linked-level metadata in Lesson preview. Use Edit or Flag an issue to work on a specific item; source comparison is optional there. Mark issues resolved explicitly, then approve the complete lesson locally to establish a baseline. Individual review checkboxes remain optional. Editing content invalidates approval; objective reordering alone does not. Export Markdown for copying/review or JSON to preserve structured records. The local review app does not itself publish; the separate native companion has the restricted reviewed-save path described above.

Use Import sources to download the source template or import a revised JSON package. It needs a title, stable unique slide ids, slide numbers, notes, and optional front matter/resource/level-association fields shown in the template. Source JSON is distinct from exported review JSON. Live Slides/Notion link import is not implemented. Do not paste credentials into the app.

Regeneration compares the prior source-derived output with your current draft and new source-derived output. Local edits survive unchanged source; conflicts and incoming deletions require a choice. Local approval is not an independent curriculum signoff and does not publish to Level Builder. The separate native companion reads current destination content; that connection is not integrated into the local review app.

Browser storage persists drafts, issue notes, pending resource JSON edits and local approvals. JSON review exports also include issue history and pending resource text in the additive review field; Markdown contains only applied lesson content. A review export still cannot restore a whole workspace. Export backups before clearing browser data. The source snapshot is read-only; reset affects browser state only. The preview is not an exact Level Builder renderer: icon placeholders are shown and Markdown support is limited. It resolves local resource references, Code Doc links, slide markers and images. Native file-picker automation stalled in this environment, so that chooser path remains unverified end to end; embedded-image insertion/rendering and reload persistence were verified. Remarks flags are stored but their Level Builder rendering has not been tested.

Current sandbox: https://levelbuilder-studio.code.org/courses/6-12-dev-playground/units/16/lessons/11 . The previous sandbox is not used. Ask before any future sandbox save. All official sources remain read-only.

Not yet implemented: direct authenticated source import, full destination-aware three-way revisions, automatic publishing, AI interpretation, adding/reordering activities or reordering/removing sections and callouts through UI, source-rich text fidelity beyond the supported marker conversion, or cross-curriculum validation. Generic JSON import is available but requires normalized source preparation.

If the default port serves another project, use `$env:PORT='43829'; npm start` in PowerShell. Startup prints the served directory. Browser storage is separate for each hostname and port; an empty workspace on a new address does not mean an old workspace was deleted.

Tests are engineering checks from observed facts and proposed requirements, not independently approved gold outputs. See IMPLEMENTATION.md for scope and iteration limits.

## Sprint demo — November 20

Open http://127.0.0.1:43829/workflow.html on the existing local preview, or use **Transfer demo** in the lesson workspace. If restarting the server, run it from this checkout's prototype folder with PORT=43829. The default npm start port remains 4316.

1. Click **Load demo lesson**, then **Read fresh destination and prepare review**.
2. Show the four existing-level links, three assessments, preserved destination content, and restored original editor. Check the approval box and click **Approve and simulate save**.
3. Show the verified result. Click **Check saved result again — no resend**: the simulated request count stays at one. Reloading retains this run. **Start another isolated demo** creates a new run without deleting the earlier report.

The demo uses the bundled AI Lab source snapshot and synthetic destination/mapping/server data. It performs no authenticated requests and does not touch the accepted saved lesson. The lesson workspace can separately demonstrate preview, editing, issue flags, local approval, and export. Do not describe the demo save as a new live acceptance.

## Reusable companion workflow

Reload the installed native companion once to pick up version 0.5.0. From an owned practice lesson's canonical /lessons/ID/edit tab, open the companion and choose **Open reusable lesson transfer**. Confirm the exact practice URL and permission to edit it, load an approved review-package JSON file, then prepare a fresh review. Keep the original editor tab open. This screen does not fetch accepted-rehearsal.json or local-save-job.json.

Preparation reads current saved data, refuses a stale editor or known unsaved content/settings, verifies existing-level mappings, rehearses and restores supported teaching fields and links, and checks unit conflicts. Only a separate checkbox/button approves the exact save. It persists a restore point and attempt receipt before at most one PUT, then independently reads saved content. A resumed attempted job is readback-only. Outside edits block guarded cleanup. Downloaded reports are private and include source, destination and restore evidence; do not commit them.

Destination confirmation is the user's attestation that the selected lesson is an editable practice lesson, not automatic classification of official curriculum. Every injected operation rechecks confirmation, canonical URL, tab, and lesson identity. Server permissions still apply. Legacy tools retain their original assigned-playground defaults.

Companion 0.10.2 supports reviewed saved transfer for overview/student overview, purpose, preparation, assessment opportunities, existing activity/section titles, whole-minute timing, section guidance and remarks, alongside existing-level additions to empty progressions. Exact before-and-after values appear in the save review, including intentional blanks. The destination lesson title remains preserved. New sections can append to existing activities with all five callout types. Existing callout text/type and verified levels inside newly appended sections are supported. Existing-callout edits are refused for sections containing multiple callouts until targeting is verified. Append-only new activities and callouts on existing sections are supported. Objective/vocabulary/resource collection changes, unsupported mappings and unit conflicts block the entire reusable saved workflow. Teaching-field and appended-section saves have local regression and browser simulation coverage, not live saved acceptance. No new live save was performed; direct authenticated native rehearsal and full content comparison passed with zero differences to the scoped package. Extension baseline synchronization and broader content mappings remain future work.

## Reviewed test cleanup — November 20 follow-up

Companion 0.6.0 implements receipt-owned saved-link cleanup. After verified transfer it automatically prepares the exact removals. Cleanup requires separate approval, persists recovery evidence before dispatch, sends at most once, verifies fresh saved data, rechecks without resend, and downloads the report automatically. Imported successful reports support earlier runs. Only unchanged associations from the verified test receipt are removed; underlying levels and unrelated saved content remain. Changed links, outside unsaved edits, stale reviews, and unreadable evidence block dispatch. Native editor refresh is guarded against outside edits.

The complete simulated transfer/cleanup/reload/recheck cycle passed, with exactly one cleanup request and verified restoration. Deduplicated local storage retains complete recovery evidence and reads legacy records. This supersedes earlier statements that saved cleanup is unimplemented. Native cleanup is implemented but has NOT been live-accepted; no live links were removed by this change. Reload the installed companion once to load 0.6.0, then review and approve the exact cleanup on the owning practice lesson.

## Full workspace backups — November 20

The workspace footer now offers Download workspace backup and Open backup as separate workspace. This dedicated format preserves source, generated content, draft edits, baseline, review flags, conflicts, approval and pending resource text. Restoring validates the file and writes a new isolated workspace before navigating; the original workspace is not replaced. Review-package exports remain transfer documents, not workspace backups. Transfer receipts remain separate and are not included.

Verified actual browser download and file-picker restoration into a separate workspace. All 128 regression tests pass, including invalid formats, preserved pending edits, no overwrite and failed storage. User elected to move on from live cleanup testing; live cleanup remains unaccepted and existing live links remain untouched.

### Teaching-transfer demo (0.7.0)

Open `workflow.html`, select **Load teaching-text demo**, and prepare the review. Expand the four teaching changes to inspect preparation, activity title/timing and section guidance. The demo also adds four existing-level links. Approve the simulated save, then reload and recheck: the request count stays one. Link cleanup retains the teaching changes. This simulation has no authenticated writer. See [teaching transfer checks](TEACHING-TRANSFER-ACCEPTANCE.md).

### Appended-section demo (0.8.0)

Select **Load broader transfer demo** on a fresh `workflow.html` run. The exact review shows an appended reflection section with teaching text, timing, remarks, and all five callout types. The demo also includes teaching-field changes and the four original level links. Preparation restores the original synthetic editor; approval sends one simulated request. Reload and recheck do not resend. Link cleanup keeps the new section and teaching changes. See [structural transfer checks](STRUCTURAL-TRANSFER-ACCEPTANCE.md).

### Broader transfer (0.10.0)

The broader demo now includes an existing callout changing type and text, plus an existing level linked inside the new section. Exact review shows level-group titles and readable callout types. Usage checks and receipt-owned cleanup cover new-section links; cleanup keeps the new section and teaching edits. `native-adapter-fixture.html` offers **Check existing callout edit and restore** for browser-only control verification. No live acceptance is implied. See [broader transfer checks](BROADER-TRANSFER-ACCEPTANCE.md).

### Current hardening checkpoint (0.10.2)

All 168 automated tests pass. Modern alertdialog confirmation handling is covered by the native-shaped fixture. Existing-callout edits in multi-callout sections block before any batch mutation. Saved existing-section links now verify order, active identity, variants and every supported flag in addition to their level IDs. See [activity transfer evidence and limits](ACTIVITY-TRANSFER-ACCEPTANCE.md).

Direct authenticated native browser rehearsal contains three activities, ten sections, six callouts and four exact existing links (assessment flags false, true, true, true). All activity and section fields, five front-matter fields and all six callout dialogs exactly match the scoped package. Fresh saved-baseline evidence is unchanged; existing-level pages show no playground unit conflict. The unsaved tab is retained for exact user approval. No live save has been approved or attempted. Extension automatic end-to-end remains unverified, and live saved acceptance is not claimed.
