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
