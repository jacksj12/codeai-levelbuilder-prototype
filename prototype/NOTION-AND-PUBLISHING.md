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

# Publishing updates in 0.14.0

The current suite has **274 passing tests**. New objectives can be appended; existing objectives can be explicitly mapped one-to-one in the publishing screen while preserving IDs and level tags. Confirm the mappings before downloading. Mapping packages use schema 3 and require companion 0.14.0. Native rehearsal restores only its own unsaved additions. Independent saved verification handles alphabetical objective ordering by matching persisted IDs.

Progression titles and assessment flags can change without replacing their existing level links. Existing callouts can be edited when their section has several callouts; the native dialog and complete captured result must match the reviewed target. These paths have simulated end-to-end and serialized native-control tests. They have not been exercised as new live changed saves.

The complete publishing build remains unfinished. Shared-resource creation, vocabulary writes, saved-content removals, replacement/reordering of saved level links, asset uploads and production destinations are blocked. The current approved private lesson package still requires no save: the production comparison returns four existing levels and no differences. No saved lesson content was changed for 0.14.0.

Source evidence for the verification fix: [Lesson summary and objective update](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/models/lesson.rb). Native controls: [Objectives editor](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/ObjectivesEditor.jsx), [section controls](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/ActivitySectionCardButtons.jsx), [callout icon](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/LessonTipIconWithTooltip.jsx).

The entries below record the prior Notion setup and acceptance history; their version numbers and earlier capability limits are historical.

# Notion sign-in and practice publishing — 0.13.1

## Local startup

From `prototype`, run `npm start` and open `http://localhost:4316`. Existing workspaces on other browser origins remain unchanged. The preview binds only to the local computer. No additional dependencies are required with the installed Node 24 runtime.

## Notion registration and sign-in

1. In the [Notion developer portal](https://app.notion.com/developers/connections), register an OAuth connection named **Lesson Studio**. Creation accepts Notion's Developer Terms and must be completed by the account holder.
2. Register exactly `http://localhost:4316/api/notion/callback`. The portal rejects numeric IP addresses in redirect URIs.
3. Configure read-content capability only. Do not grant insert/update content capabilities for this importer.
4. Put the app's client ID and secret in a private `prototype/.env`, using the names in `.env.example`. Never put credentials in source files, chat, lesson content or exported packages. `.env` is Git-ignored.
5. Restart the local server, then open **Import sources → Sign in to Notion and import a brief**. Authorize only the lesson pages needed for import.
6. Paste the brief's Notion URL, choose **Read lesson brief**, then review the imported brief in the workspace. For an existing extension workspace or another browser origin, choose **Download brief for another workspace**, then use its **Import sources** control to select the downloaded JSON. Slides and existing draft content are retained until explicit source comparison decisions.

Client credentials are server-side environment settings. Access and refresh tokens remain in server memory, keyed to an HttpOnly, SameSite session cookie. Tokens never enter browser storage, source exports, URLs, reports or logs. Sessions expire after eight hours and disappear when the server stops. **Disconnect locally** removes the local credentials; it does not revoke the connection in Notion's account settings.

The implemented OAuth flow uses one-use, expiring session-bound state, server-side code exchange and refresh-token rotation. API requests follow [Notion authorization](https://developers.notion.com/guides/authorization/overview) and [block pagination](https://developers.notion.com/reference/get-block-children), pinned to API version `2026-03-11`. Imports read the selected page and all returned child blocks with size, depth and request bounds. Incomplete pagination, unavailable blocks and changes during import reject the result without replacing the draft. Unsupported content still requires an export that the existing importer supports; it is not silently discarded.

## Publishing workflow

1. Review and approve the assembled local lesson, then choose **Publish practice lesson**.
2. Import a clean saved-baseline report from the companion. The preflight preserves the destination title, checks existing content and identifies unsupported collection/progression changes. A matching lesson reports that no save is needed.
3. Download the destination-bound package. Use **companion 0.13.0 or newer**. Its schema version deliberately prevents older companions from silently ignoring destination/baseline binding.
4. Open the checked practice lesson and load the package in **Open reusable lesson transfer**. Preparation verifies the package digest, exact destination and saved baseline before any staging. It then uses the existing rehearsal, restoration, exact-save approval, durable receipt and independent readback workflow.
5. Import the completed native report into the publishing screen. It checks review/plan integrity, exact package binding and saved content independently. Demo and preservation-test receipts cannot complete a publication. Verified completion disables package redownload and locks that run; later changes use a separate publication review.

This completes the supported practice-publication handoff and verification workflow. It does not enable shared-resource creation, objective/vocabulary collection mutations, replacement of populated progressions, arbitrary deletions, asset uploads or general production publishing. These remain explicit blockers; no unsupported edits are omitted and reported as success.

## Validation and live boundary

255 local tests pass. New coverage includes OAuth state/replay, expiration/cancellation, credential non-disclosure, refresh, disconnect races, nested pagination, source-change rejection, same-origin/CSRF guards, brief export handoff, stale publication packages/baselines, unsupported objectives, one simulated save and independent receipt verification. The actual publishing UI completed the synthetic package → baseline → receipt flow, including reload and no-resend controls, with no console errors. The Notion setup UI displayed the correct localhost redirect and unconfigured state.

Live Notion sign-in and import succeeded with the read-only LevelBuilder AI Workflow Connection. The correct full brief is L16: AI Lab in AP CSP Development Tracker, not the similarly named progression summary. Six fields imported, including three objectives and three resources; the Link to levels heading remained a warning. Portable JSON download and workspace source-review handoff passed. Credentials are configured only in the ignored local .env.

The final approved draft preserves saved resource records and wording/formatting. Production preflight against the independently verified native receipt returned already-matches with zero changes/blockers and four retained levels. A fresh native editor page then confirmed exact equality of all 15 visible text areas, resource and objective content, callouts, four level names and three assessment flags. No new save occurred. This fresh visible-DOM check is not a full serialized companion receipt; the final no-change preflight was run with the production module locally, not completed as a new browser receipt flow. Private evidence remains outside Git.

The current preservation/no-save verification is complete. A future changed publication still requires a fresh companion baseline and live receipt. Installed companion remains last verified at 0.12.3; source is 0.13.0. Reload to 0.13.0+ only when that changed publication is needed. Do not resend historical attempts or change the saved lesson to manufacture a publication test.

## Objective descriptions in 0.13.1

One uniquely identifiable objective text replacement can now be staged, restored, separately approved, saved and independently verified. Native record IDs and level tags are retained; changed IDs, tags or other metadata fail verification. Objective additions/removals and multiple unmatched descriptions still require a separate collection workflow. Five added tests cover the pipeline and serialized native row controls; full suite is 260 passing tests. No live write acceptance is claimed for this new feature.

Upstream references: [ObjectivesEditor](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/ObjectivesEditor.jsx), [ObjectiveLine](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/ObjectiveLine.jsx), [AddResourceDialog](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/AddResourceDialog.jsx), [AddVocabularyDialog](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/AddVocabularyDialog.jsx). Resource/vocabulary writes are immediate shared-record mutations and cannot be treated as unsaved lesson rehearsal.
