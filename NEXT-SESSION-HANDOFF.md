# Native unchanged-save readback and installed source import — November 20, 2026

The user confirmed the installed Slides import opened source review with 15 slides, blank notes on slide 1, identity/mapping warnings and the existing brief retained. This establishes the signed-in installed Slides import UI outcome; no generation or remote lesson save was performed by that import.

The user then explicitly requested a save/readback test preserving all content, followed instructions to perform one unchanged native Save and Keep Editing, reload, and download a fresh baseline report. New report: Downloads/reviewed-transfer-47a9f509-ebe6-4ab7-b197-1610e94a7d62.json (17:30 local), companionVersion 0.12.1, destination 8898984, baseline-read, stagingStarted false, no errors or recovery. Independent comparison against prior reviewed-transfer-04c23637 baseline found ZERO differences in the entire saved lesson. Clean baseline checks pass and editor bootstrap equals fresh saved data. All four association IDs 397418–397421 and original level IDs 104255/104271/104272/104273 remain, with only the final three assessments. Three activities, ten sections, three resources and three objectives retained.

This validates unchanged native save plus independent readback, together with the user-reported save action. It is NOT live acceptance of the companion save-dispatch button: that button requires an actual reviewed change, and no such change was introduced. Preserve this distinction. Private reports remain outside Git.

# Installed 0.12.1 unsaved acceptance — November 20, 2026

The user ran the installed companion automatic check and downloaded native-automated-verification.json at 17:25 local time. Report confirms companionVersion 0.12.1, destination 8898984, status passed-and-restored, checksPassed true, restored true, saved false, remoteWrites false and no skipped fields. All 12 scalar fields were exercised, including intentional interruption/resume and repeat staging. Temporary structure exercised all five callout types and was removed. Independent recomputation compared normalized initial lesson plus nativeProtection against structure.finalCapture: exact equality. All four original levels and three assessment flags remain intact. This establishes installed-extension unsaved acceptance; it does not establish the new native-save dispatch branch or signed-in Slides import live acceptance. Preserve the private report in Downloads.

# Automatic check target correction — November 20, 2026

Release 0.12.1 fixes the legacy popup automatic check being restricted to lesson 8898985 while the current owned playground is 8898984. The exact current canonical URL is now supported without allowing arbitrary official lessons. The launcher shows progress, binds the run to its selected destination, refuses reuse of another lesson controller, and does not silently restart an existing check. Recovery records are separated by destination. Downloaded workflow and completed verification reports now include companionVersion. Full suite: 213 passing tests; syntax and whitespace checks passed.

The user downloaded native-scalar-staging-evidence (2).json, which contains historical passed-and-restored evidence for 8898985; it is not evidence of a fresh automatic check on 8898984. The fresh reviewed-transfer-04c23637 baseline reports do pass current editor/saved equality and retain all four associations 397418–397421 with correct flags, but carry no version field. The user must reload 0.12.1 and launch the automatic check from the popup on 8898984, not Download evidence or the reusable transfer screen. No new live save or cleanup was performed.

# Source imports and connected-browser boundary — November 20, 2026

Release 0.12.0 implements source imports beyond normalized JSON:

- Google Slides PowerPoint exports, preserving presentation order and speaker notes, excluding slide-number placeholders. ZIP parsing validates integrity, bounds decompression, rejects unsafe entries and external XML entities, and ignores binary media. PowerPoint fallback identities bind both exported ID and notes, preventing renamed/renumbered slides from silently inheriting unrelated mappings. Edited notes may therefore require explicit deletion/addition decisions. Slides API JSON retains original object IDs.
- Notion Markdown and complete nested blocks JSON, including the real brief's Overview (Teacher), Overview (Student), Links and Vocab aliases, column wrappers, escaped exemplar titles and objective preamble. Pagination, missing children and unsupported blocks fail explicitly. Teacher/student resource audiences and answer-key restrictions are preserved. Unknown headings remain warnings through generation and reload.
- Multi-file import combines one presentation and one brief before the user chooses Generate / compare changes. Drafts remain untouched during parsing or failed imports. Presentation import preserves current brief fields; a partial brief updates only recognized fields. Complete JSON packages are imported separately.
- The companion has a read-only signed-in Slides import button using existing activeTab/scripting permissions. It exports only the selected deck, rejects navigation changes and sign-in HTML, validates the file, and opens a source review in the extension workspace. No credentials, new permissions, API keys or dependencies. This new installed-extension path is locally tested, not live accepted.

Actual source checks: exported the original Google deck read-only through the available browser; it currently has 15 slides, 14 with notes. Fetched the original Notion page through its connected tool and parsed both overviews, exactly three objectives, preparation, three resources with correct audiences, and empty vocabulary. Private source export/brief files remain outside Git. In a separate local browser workspace, selecting both real files produced the source summary, and comparison produced 16 updates and four explicit revision conflicts without touching the saved lesson. Screenshot retained in the chat visualization folder. The original four saved levels remain unchanged.

Native save validation was broadened with an asynchronous deployed-editor acknowledgement regression. Existing tests verify one click, zero companion PUTs, no timeout fallback, durable attempt storage, independent readback and no resend across reload. Full suite: **212 passed, zero failed**.

The user explicitly requested extension reload and native workflow validation, then enabled Edge/Chrome and computer control. Edge and Chrome became discoverable. However, claiming edge://extensions was refused, and claiming the known chrome-extension:// companion page was explicitly blocked by browser security policy (only HTTP/HTTPS allowed, no alternate-surface workaround). A subsequent inventory still returned no native apps. We did not bypass this policy, reload the installed extension, or claim installed-extension live acceptance. No additional save or cleanup occurred. The current source code is ready for reload when a permitted extension-control surface is available. This is an access blocker, not missing user permission; do not ask the user to reauthorize the same requested work.

Direct in-app Notion sign-in is not implemented: Notion imports use exported Markdown/complete blocks JSON, with the original brief additionally validated through the connected Notion tool in this session. General publishing/shared collection mutations remain outside the supported transfer surface. Do not call the entire historical roadmap complete.

# Native save recovery and completed local authoring — November 20, 2026

Companion 0.11.0. This entry supersedes the unresolved live-state claim below; historical failed receipts remain unchanged.

## Live result

The user explicitly approved ONE fresh native save after reviewing the four original associations staged in lesson 8898984. Save and Keep Editing was clicked once. An independent fresh editor read verified levels 104255, 104271, 104272 and 104273, saved association IDs 397418–397421. Only the last three are assessments. The chatbot is in Test, Score, and Reflect; the assessments are in Check for Understanding. Removing only those new associations and progression names from the readback yields the original whole-lesson baseline exactly. Teaching content, resources, objectives, settings and existing record identities were preserved. No source cleanup or second save occurred.

Private attempt, fresh readback and verification files are in the ChatGPT backup/evidence folder, not Git. The new native result does not rewrite or revive the historical failed direct-request receipt. The underlying deployed HTTP-200/no-op cause remains unknown because the original response body was discarded. The proven recovery is the native editor save; do not invent a server-side root cause.

## Build completed in this release

- Newly prepared reviews default to the deployed editor's Save and Keep Editing handler. Transport choice is bound to the reviewed digest and approval. The final bridge retains baseline, capture, destination and expiry guards; clicks one unambiguous enabled save control once; and never falls back to a direct PUT or retries. A native acknowledgement is only diagnostic: independent saved readback still determines success. Legacy reports keep their original digest and transport for verification.
- Field-level source reconciliation preserves independent local edits. Activity deletion is one explicit grouped decision that includes local child sections. Blank text deletions require decisions; invalid orphan/duplicate structures block approval and backup import. Source ordering merges preserve local anchors and conflicting order changes require decisions.
- Local authoring now adds activities, moves activities and sections, preserves zero-minute sections, and parses all five callout types from source notes. Added content survives unchanged source imports, export and reload.
- Concurrent workspace changes fork a recovery workspace instead of overwriting the other tab. Storage errors retain the in-memory draft and existing stored content.

Validation: 202 automated tests passed, zero failed. Serialized native bridge tests cover one native click, zero companion PUTs, ambiguous/disabled controls, transport-bound approval and timeout without fallback. Full regression includes prior save, restoration, cleanup, mapping and repeat-readback paths. Browser acceptance created and moved a local activity, added a zero-minute section, refreshed unchanged sources and reloaded with content intact. No additional live save was used for acceptance.

## Remaining integration boundaries

This is not a claim that every historical roadmap item is finished. Direct Google/Notion sign-in requires an application authentication configuration that this checkout does not contain; current import remains normalized JSON. Shared resource/objective/vocabulary creation, arbitrary publishing, complete destination-aware revision reconciliation and cross-curriculum live acceptance remain outside the implemented transfer surface. The reusable native-click branch has serialized local tests but has not been run through an installed extension live; the separately approved native UI save above is the actual deployed acceptance. Live receipt-owned cleanup remains unaccepted. Do not perform another save or cleanup under the exhausted one-save approval.

Work is in the GitHub checkout. The installed companion has not been reloaded. Preserve the historical attempted run; use a fresh review for future authorized work after loading the updated extension. No new permissions or dependencies were added.

# Autonomous continuation — response diagnostics and recovery, November 20, 2026

The user resumed implementation and requested autonomous build/test loops with no input. This entry supersedes the paused-work instruction below; historical receipts and exact-save boundaries remain preserved.

Completed companion 0.10.6 in the working GitHub checkout, not the old ChatGPT backup:

- Finished the previously untested success-response summary. It records only numeric lesson/section/association/level identities, assessment flags and counts. HTML, arbitrary JSON fields, private lesson text and authentication fields are excluded; truncated identity lists are explicitly labeled.
- Tested the actual serialized native bridge against synthetic DOM and HTTP responses, including valid summaries, malformed JSON, HTML, invalid shapes, bounded lists and rejected-response redaction. These are local transport tests, not live acceptance.
- Added clear report explanations separating HTTP status, response summary and independent readback. Old attempts without response bodies are explicitly identified; the missing body cannot be recovered retroactively.
- Added the isolated unconfirmed-save demo. HTTP 200 intentionally leaves saved data unchanged. The real controller retains the receipt, disables another save and cleanup, downloads the report, and rechecks after reload without resending. The regression exercises three repeat readbacks.
- Fixed stale readback errors remaining after a later successful independent read.
- Added read-only `prototype/scripts/audit-transfer.mjs`. It validates the retained review digest and recomputes readback verification without network access or evidence changes. Both original attempted-save and recheck reports were audited successfully: unchanged baseline, missing level associations, no verified save.

Validation: full suite **184 passed, zero failed**; targeted transport/save checks passed; Git whitespace check passed. Actual local browser walkthrough on port 43835 completed failure preparation, one simulated save, reload and readback-only recheck. UI reported one simulated send and zero saved associations. Screenshot is in this chat's visualization folder. Existing broader successful workflow, cleanup, preservation, backup and recovery tests remain green. No runtime AI calls, dependency installation, or permission expansion.

Read-only authenticated browser access was available this time. A fresh editor load of lesson 8898984 showed the intended teaching content and no structured level associations. No native field was edited and no save, cleanup, reassignment or retry was made. The original historical attempted run was not modified.

**Remaining blocker:** the cause of the deployed HTTP-200/no-persistence result is still not proven. The original response body was discarded by the earlier version, and current reads cannot recreate it. Public controller source confirms that an update returns lesson JSON but does not explain the observed outcome. Do not label this release a persistence fix or claim the four original levels are now saved. Any new live attempt requires a fresh exact review and separate authorization; this build does not enable retries of the retained attempt. The installed extension has not been reloaded by this session.

Other backlog (direct authenticated source import, shared collection mutation, broad publishing and cross-curriculum acceptance) remains unfinished. The current priority is proving/fixing the failed original-level transfer, not substituting an unrelated teaching-only package.

# PAUSED FOR DIFFERENT MODEL — failed live save, November 20, 2026

This checkpoint supersedes historical instructions below. The user explicitly stopped this model's work and requested a handoff to restart with another model. Only this documentation update is authorized now. No implementation, tests, browser operations, saves, cleanup, retries, commits or pushes are running. No further save is authorized; preserve the attempted receipt and do not click Save again or create a fresh run to evade its readback-only state.

## Intended outcome and live state

The user wants the four ORIGINAL existing levels reassociated into selected practice lesson https://levelbuilder-studio.code.org/lessons/8898984/edit (Julian Playground - ChatGPT), preserving all teaching content, resource/website links, objectives and other settings. The teaching-only engineering-section package was a rejected substitute; do not advance it as the requested outcome. Resources/website links mean URLs; level associations mean structured scriptLevels.

The user reports manually removing the four associations from source https://levelbuilder-studio.code.org/lessons/8898985/edit (Julian Playground - chatGPT(Cleared)) so the originals can be reused in the same unit. No underlying levels, lesson or teaching content was authorized for deletion. Historical source associations were 397404–397407 for levels 104255, 104271, 104272 and 104273. Older companion receipts owned different associations (397256–397259) and must not be replayed or relabeled. Source removal was user-operated, not an agent-performed or independently readback-verified cleanup.

Clean destination baseline reports (2) and (3), basename reviewed-transfer-741370c1-699b-44a0-b61c-229bab6b37b0, agree and pass the baseline guard: three activities, ten sections, three resources, three objectives, zero vocabulary entries and zero saved level associations. Earlier same-basename reports preserve real unsaved-association evidence; they are not the latest baseline.

Exact requested transfer package: C:/Users/Jackson Work/Documents/Lesson Studio Checks/lesson-8898984-original-level-transfer-review.json. Local simulation evidence: lesson-8898984-original-level-transfer-local-check.json in the same directory. It proposes one non-assessment library-chatbot association under Test, Score, and Reflect and three CFU assessments under Check for Understanding. No new activity, section, teaching-field or shared-collection mutation. These private files are outside Git; package approval describes engineering correctness, not human curriculum signoff. Later user approval of the actual live review is recorded below.

## Actual live preparation, approval, attempted save and recheck

All three following reports are in C:/Users/Jackson Work/Downloads/; preserve their complete original contents:

- reviewed-transfer-d108be3f-2539-41fe-8950-8de277a82a43.json: successful LIVE reusable preparation, ready-for-review / passed-and-restored. Exactly four original level associations, three assessments, no other changes. This establishes live preparation/restoration for this scoped package, not a successful save.
- reviewed-transfer-d108be3f-2539-41fe-8950-8de277a82a43 (1).json: the user explicitly checked approval and clicked Approve and save once. The attempted receipt records HTTP 200, ok=true, outcome=response-received. Independent saved readback for lesson 8898984 contains ZERO scriptLevels, matches the saved baseline, and fails verification. Status save-not-confirmed; attempted=true; baselineUnchanged=true. No successful saved transfer is established.
- reviewed-transfer-d108be3f-2539-41fe-8950-8de277a82a43 (2).json: a separate user-operated READBACK-ONLY recheck still reports save-not-confirmed, baselineUnchanged=true, zero saved associations, verification false, saveRetried=false, no preparationError. This was not another save. Do not ask the user to repeat an immediate recheck already completed or call this verified success.

The first attempted-save report was reported at 15:54:16 and the readback-only report at 15:55:36 local time. The second unchanged readback rules out only an immediate read-after-write delay through that check; it does not establish the server-side cause.

## Proven findings versus unknowns

Inspection of the retained attempt confirms its approved request and staged capture both contain all four requested original level identities and assessment flags. Endpoint is PUT /lessons/8898984; content type application/json;charset=UTF-8; activities is a JSON-serialized complete array; originalLessonData identifies the selected destination. The payload shape and native transport pattern match the earlier independently successful four-association companion receipt in Documents/Lesson Studio Checks/approved-save-success-receipt.json. Both current saved readbacks are unchanged, so verification correctly refused success and retained the no-resend boundary.

NO ROOT CAUSE OR PERSISTENCE FIX HAS BEEN PROVEN. Static comparison did not establish missing associations in the approved payload, a wrong destination, or a serialization mismatch. Public Code.org source was inspected read-only; deployed behavior may differ. Do not state that caching, server normalization, ignored parameters or another save caused this outcome without evidence.

A proven DIAGNOSTIC GAP is that native-dom-adapter.mjs discarded the successful HTTP response body; the historical receipt therefore cannot show which lesson/associations the HTTP 200 body actually returned. That body cannot be reconstructed retroactively from these reports.

## Checkout and deliberately unfinished edits

Working checkout: C:/Users/Jackson Work/Documents/GitHub/codeai-levelbuilder-prototype. Branch main. Last committed release: 7bb265b (baseline progress/early errors, manifest 0.10.5); preceding local commits a4fdf68 and 8f41284. These delivery commits were NOT pushed. Last fully verified suite: 175 passing checks, zero failures. No newer verified test total exists.

Current uncommitted files, confirmed during this documentation-only handoff:
- NEXT-SESSION-HANDOFF.md: this checkpoint and intervening evidence notes.
- prototype/dist/native-dom-adapter.mjs: unfinished, UNTESTED change to retain an allowlisted success-response summary (lesson ID, activity/section counts and association/level identities), excluding arbitrary response content/authentication fields. It is diagnostics, not a proven fix for the missing persisted associations.
- prototype/test/save-review.test.mjs: new UNRUN regression for HTTP 200 plus unchanged saved baseline remaining unconfirmed/readback-only across repeated execution.

The stop arrived immediately after those two edits. No tests, commits, reloads or live operations were performed afterward. Review these diffs before deciding whether to keep them; do not present them as tested or shipped. Do not accidentally include private packages/reports in a commit. No design exception was persisted: attempts to save the unrelated narrow glow exception failed with Access is denied; no design work is needed for this handoff.

The on-disk manifest is 0.10.5, and that was the last instructed installed release. The installed browser revision was not independently inspected because no CUA browsers/apps were exposed. Do not instruct another reload merely to install the untested edits. If a subsequent model completes and verifies a fix, it must explain exactly which extension reload/new screen is needed while preserving this attempted run and evidence.

## Evidence, access and safest next investigation

Private reports remain in Downloads. Older generated demo/transfer/native-verification JSON reports were ARCHIVED, not deleted, into C:/Users/Jackson Work/Downloads/Lesson Studio report archive - 2026-11-20. Private packages, receipts and restore points remain in C:/Users/Jackson Work/Documents/Lesson Studio Checks/. Historical accepted native-save evidence is in C:/Users/Jackson Work/Documents/ChatGPT/AI Build Day - LevelBuilder Prototype/; that folder is a backup/evidence source, never the build checkout. Do not alter original receipts or disclose credentials/raw authentication content.

Browser access was unavailable via CUA; do not bypass that with shell/CDP/Playwright or browser-profile access. File inspection of user-downloaded reports is available. No remote operation is in flight.

For the next model, begin with READ-ONLY comparison of the actual preparation/attempt/recheck reports and the two untested diffs. Preserve exact originalLessonData, receipts and restore points. Distinguish the real approved request, server response (not retained), and independent readbacks; do not substitute synthetic adapter success for deployed behavior. If the server-response or native network evidence remains necessary, request only the minimal non-secret evidence and make the access limitation explicit. No blind retry, cleanup, reassignment, or new save may be used as a diagnostic. Any later native fallback or new attempt requires a fresh concrete review and separate explicit authorization; the prior UI approval covers the already-attempted request only.

# User priority correction — original level reassociation, not teaching-only test

The user explicitly wants the four original levels reused in selected lesson 8898984 and says to remove their associations from Julian Playground - chatGPT(Cleared), lesson 8898985, to resolve same-unit conflicts. Stop advancing the substitute engineering-section package. This instruction permits preparing removal of precisely four associations; exact fresh-review approval is still required before dispatch. It never authorizes deleting a lesson, underlying levels, teaching content, resource/website links, objectives or other settings.

Read-only inspection of retained native-teaching-saved-baseline.json in the original private backup workspace confirms historical saved associations: 397404 -> 104255 (library chatbot, assessment false), 397405 -> 104271, 397406 -> 104272, 397407 -> 104273 (the three CFUs, assessment true). Source section IDs are 66015858 (Test, Score, and Reflect) and 66015859 (Check for Understanding). These are historical accepted native-save evidence, not a fresh source read. Current source identities and untouched baseline still require confirmation.

Receipt-owned cleanup cannot legitimately use the older companion receipt: its owned IDs 397256–397259 differ. planTestLinkCleanup and the injected save-approved-cleanup guard require a verified companion save receipt, its original empty progressions, and exact unchanged current ownership. The latest native UI save has native verification evidence but no corresponding approved-native-save-receipt. Do not fabricate/relabel a receipt, replay old cleanup, or weaken those guards. Supported fallback is a fresh explicit native UI proposal to unlink these four associations, preserve progression titles and all other records, review before native Save and Keep Editing, then independently read saved data before destination transfer. Native adapter unsaved cleanup itself refuses persisted associations, so it is not an alternate way to remove them.

Minimum user action now (agent browser access remains unavailable): from lesson 8898985 open a fresh reusable screen, confirm its exact practice URL, leave package empty and choose Read baseline only and download report. Do not remove or save anything yet. Inspect that fresh report to prepare the exact four-removal review. After separately approved source removal and verified readback, prepare destination 8898984 with fresh exact-name mappings and unit-use checks, and seek separate approval for that destination save.

Independent preparation completed: C:/Users/Jackson Work/Documents/Lesson Studio Checks/lesson-8898984-original-level-transfer-review.json contains the actual requested four-association proposal, preserving the report (3) destination draft exactly. One non-assessment library-chatbot association goes under Test, Score, and Reflect; three CFU assessments under Check for Understanding. There are no new sections, activities, teaching changes or shared collection changes. Metadata marks source removal and destination save unapproved and fresh source-cleanup/mapping/usage evidence required. Private local-check JSON records preparation/restoration using historical name mappings and synthetic unit preflight; zero saves. Live preparation must wait until source removal is saved and verified. The engineering-section artifact is retained only as unused local evidence, not the requested outcome.

No code or remote change in this step. Full regression remains 175 passing checks from the last code release. Private packages/evidence stay outside Git. This updated handoff is the only uncommitted repository change; no push was performed.

# Terminology clarification for selected practice test

The user meant resources/website links when discussing links visible after reload. This is compatible with report (3): its three resource records and narrative website URLs are saved. Use level associations for structured scriptLevels; do not conflate these with resources/website links. The apparent report/screen disagreement is resolved. The prepared engineering package preserves all three resource records and all existing section bodies and URLs exactly. Local preparation/restoration and preservation checks were repeated after clarifying the synthetic callout wording to level associations. No current-screen claim or live modification was made. The package remains bound to report (3), and live preparation must revalidate the fresh baseline before any staging; no live save is approved.

# Clean selected baseline and scoped engineering package prepared

Fresh selected-destination reports (2) and (3) now pass assertCleanSavedBaseline, have no preparationError, and agree exactly. Both preserve stagingStarted=false. Lesson 8898984: Julian Playground - ChatGPT; three activities (Warm Up / Activity / Wrap Up), ten sections, three resources, three objectives, zero vocabulary entries and zero saved level associations. Earlier report (1) remains evidence of four real unsaved links; it was not overwritten or normalized away.

Private package for user selection: C:/Users/Jackson Work/Documents/Lesson Studio Checks/lesson-8898984-engineering-section-review.json. Companion verification evidence: same directory, lesson-8898984-engineering-section-local-check.json. These files contain private curriculum and remain outside Git. No credentials were copied into a new artifact. Package status approved-locally refers transparently to agent engineering-correctness review only; review/engineeringTest metadata explicitly states no human curriculum signoff, liveSaveApproved=false and cleanupApproved=false. Validation was used unchanged; no bypass or product code change.

The exact proposal appends one untimed remarks section to Wrap Up: Companion engineering check — do not teach. It contains clearly labeled engineering-only guidance and one Teaching Tip. No level links or shared collections are added. Existing front matter, activity titles/timing, ten original sections/callouts, all resource/objective/vocabulary associations and all existing database identities remain preserved. Counts after a later separately approved save would be three activities and eleven sections, with one additional callout and no added levels. Link cleanup does not remove this section; any later live removal needs separate authorization.

Preparation-only local simulation used the actual report (3) saved/native captures and demoAdapter; the real prepareTransfer pipeline staged/restored 19 local adapter actions with zero saves and no approval object. Save review has exactly one section addition, no activity additions, no field changes and no existing-level groups. Removing that one proposed append from its complete activities request exactly matches the saved activities; all six root text fields also match exactly. This does not establish live native preparation or live save acceptance. Existing full regression result remains 175 passing checks; targeted section/reusable checks also passed.

Next user action: from a fresh reusable screen launched from selected lesson 8898984, confirm practice permission, then select lesson-8898984-engineering-section-review.json. Package selection automatically runs live UNSAVED rehearsal and restoration; this preparation is authorized. Inspect that the exact review shows only the one new engineering section and callout. Download the resulting report before any further step. Do not click Approve and save once: exact live-save approval is still absent. Agent browser control remains unavailable. Accepted lesson 8898985 remains untouched; no live save, cleanup or source change was performed.

# Live selected baseline reports inspected — real unsaved links

Two fresh baseline reports for selected practice lesson 8898984 were inspected directly, preserving the originals in Downloads. Both have status baseline-read and stagingStarted=false. Fresh saved data matches the editor bootstrap, and both complete saved snapshots and native captures are identical between the reports. Title: Julian Playground - ChatGPT. The saved lesson contains three activities, ten sections and zero level associations.

The open native editor contains four actual unsaved existing-level additions: one library-chatbot level (104255, not an assessment) under Test, Score, and Reflect; three CFU levels (104271, 104272, 104273, all assessments) under Check for Understanding. All four editor associations lack persisted association IDs. These are real content differences, not null/default or numeric-ID normalization. The only normalized activity-content differences are those two previously empty progressions. The baseline guard is correct and was not weakened. Ownership/intent of these additions is unknown; no reload, staging, save or cleanup was performed.

Safe next action with unavailable agent browser control: preserve the existing editor tab and open https://levelbuilder-studio.code.org/lessons/8898984/edit in a fresh tab; launch a fresh reusable screen from that new tab, confirm practice permission, leave package empty and read baseline. This can inspect saved data without discarding the four unsaved links in the old tab. Do not load the old full four-link package: original levels are already saved on accepted lesson 8898985, so destination-unit usage must be checked before any proposed link transfer. A narrowly reviewed teaching-only proposal can avoid adding those levels, once a clean baseline is confirmed. No live save or cleanup is authorized.

No code change or new test was needed for this finding; the existing 175-check result remains the latest. Private full reports stay outside Git. Accepted lesson 8898985 remains untouched. The latest user download cleanup archived older generated reports rather than deleting evidence; do not treat archived reports as fresh selected-baseline evidence.

# Baseline-button feedback fix — companion 0.10.5

User reported that the package-empty baseline button appeared to do nothing on selected practice lesson 8898984. No fresh live report was available. The exact error from their browser remains unknown; do not claim a live root cause or successful live read.

Established code defects: baseline had no immediate progress message, its confirmation/access/read errors appeared only in Status farther down the page, and a failure before the first capture did not download or enable a report. Fixed by placing a version/progress/error status and a manual Download baseline report button directly next to the baseline control, showing a Reading baseline state immediately, reporting each read phase, and exporting early-error evidence even without a checkpoint. Retained review/save/recovery runs now explain why baseline reading is disabled. No package is needed and no change is staged/saved. Canonical URL, originating tab, explicit practice confirmation, concurrency lock and save approvals remain enforced.

Added coverage invokes the actual serialized readAssignedLesson function in an isolated JavaScript context with a denied authenticated GET response. It verifies the transport returns the actionable sign-in/permissions error, the adjacent status retains it, a report can download without any capture, and no package/job/receipt or write exists. This is simulated injected-function verification, not browser/live acceptance. All 175 regression checks pass; package graph remains valid.

Minimum user action: close the old reusable screen, reload the unpacked extension, open a fresh reusable screen from https://levelbuilder-studio.code.org/lessons/8898984/edit, verify the nearby Companion 0.10.5 label, confirm practice permission, leave package empty and click Read baseline only and download report. The adjacent message must now show reading or an exact blocker. Use Download baseline report there if needed. Read the resulting private reviewed-transfer-*.json locally before proposing scoped live tests. Do not load the old full package or click save/cleanup. Accepted lesson 8898985 remains untouched. No new live access was available during this fix.

Recorded in local commit titled Make baseline progress and early errors visible without a package. No push or automation revision change. Prior baseline commit a4fdf68; delivery commit 8f41284. Current full automatic live acceptance and live cleanup remain unverified.

# Selected practice baseline preparation — companion 0.10.4

The user selected https://levelbuilder-studio.code.org/lessons/8898984/edit for reusable companion verification. This is distinct from accepted lesson 8898985. Selection authorizes read/preparation only, not clearing, saving or cleanup. Preserve all current content and inspect a fresh baseline before choosing a scoped package. Do not load the old full AI Lab package by default; unit duplicate-level checks and existing mappings must inform any eventual test proposal.

Browser access was checked once through CUA; no browsers or apps were exposed. No live baseline was read, no native preparation was run and no live lesson was changed. Older downloaded reports exist but were not treated as a new selected-destination baseline.

To remove the package-before-baseline obstacle, 0.10.4 adds Read baseline only and download report to the reusable native screen. It needs no package, requires explicit canonical practice confirmation, pins both saved/DOM reads to the exact originating tab, and retains baseline/capture diagnostics before clean-editor validation. It never stages changes, checks level usage or sends a save. Existing preparation reuses the same guarded baseline reader. Reports remain private. A controller test for selected lesson 8898984 proves no injection without confirmation, two read-only injections after confirmation, no job/receipt/package, and refusal after the tab moves to 8898985. This is mocked controller verification, not live acceptance. Full regression: 174 passed, 0 failed; package graph and existing transfer/recovery tests pass.

Minimum user action: reload the unpacked native extension to 0.10.4; from the selected 8898984 editor open a fresh reusable lesson transfer screen; confirm its practice URL/permission; leave the package picker empty and click Read baseline only and download report. The resulting reviewed-transfer-*.json in Downloads can be read locally to scope the next test without copying private JSON into chat. Preserve current unsaved edits if the report flags them. Do not click save or cleanup. Agent browser control remains unavailable, so this user-operated read is the genuine access blocker.

This continuation is recorded in the local commit titled Add package-free selected practice baseline export. No push or automation revision change was performed. The prior delivery commit is 8f41284. The accepted saved lesson 8898985 and its private evidence remain unchanged. Full automatic live companion acceptance and live cleanup remain unverified.

# Delivery hardening — November 20, 2026 (companion 0.10.3)

This entry is current and supersedes contradictory pending-status wording in historical sections below. Work was performed only in the saved GitHub checkout. The accepted lesson and private live evidence were not accessed or changed. No live save, live cleanup, installed-extension reload or automation revision change was performed.

- Fixed a concrete reusable-screen recovery defect: an evidence-storage exception used to trigger another unguarded storage write inside the error handler, hiding the error and leaving controls enabled after final rendering. Storage failure now pauses all write controls, reports the reason, retains the in-memory state/attempt receipt for download, and prevents expiry/focus updates from re-enabling approval. The error handler remains usable when storage is still unavailable. A failed durable attempt write still prevents dispatch.
- Added four controller regression checks using the actual workflow-app handlers with a minimal DOM: broader demo preparation/restoration and one save plus reload/readback-only recheck; storage failure with downloadable evidence and disabled writes; failed durable attempt storage with zero dispatches and retained attempt evidence; and post-dispatch storage failure followed by reload/readback without resending. These are local controller simulations, not browser verification.
- Consolidated root README, prototype/README.md and browser-fill/README.md into current first-use, demo, capability, acceptance and recovery guidance. Removed mutually contradictory current setup/saving claims; retained historical evidence in the existing acceptance documents and this handoff. Updated transfer-screen acceptance wording to distinguish the accepted native UI save from the unverified full automatic companion path. Manifest is 0.10.3; reload the installed extension before its next authorized use. Committed automation-revision.json remains verification-release-20.
- Full regression from prototype: node --test --test-isolation=none => 173 passed, 0 failed. Git diff whitespace checks passed. Node v24.18.0. Fresh browser verification was unavailable: CUA inventory exposed no browsers or apps. Do not describe these controller checks as a new browser walkthrough or live acceptance.

Package readiness: a new regression check validates the manifest, unchanged minimal permissions and unarmed default revision, and traverses local HTML/module/runtime references from extension and demo entry points. It found and fixed a broken workspace link in browser-fill/workflow.html (now ../dist/index.html). The two private opt-in historical job/package files remain intentionally absent. No dependency installation or private evidence is included.

Delivery walkthrough: start the server from this checkout's prototype directory, open workflow.html, Load broader transfer demo, prepare, inspect the complete review, approve the simulated save, reload and recheck without resend. The simpler four-link and teaching-only samples remain available. Reports remain private. A local preview was started on port 43834 serving this checkout's prototype/dist; verify it is still running before relying on it.

Live acceptance remains the separately approved native UI save described next: three activities, ten sections, six callouts, four original levels and three assessments, independently read back with zero mismatches. Earlier restricted companion four-link save evidence is also retained. The reusable companion's complete automatic preparation/save workflow remains unverified end to end on the live site, and receipt-owned live cleanup remains unaccepted. Preserve the accepted lesson; no new live save or cleanup is authorized. Do not rerun the already accepted live save as delivery testing.

This continuation is recorded in the local delivery commit titled Harden companion evidence recovery and delivery readiness; resolve its hash with git log. No push was performed. No personal package or approval is included in the clone. Historical release hashes and test counts below describe their own checkpoints.

# Approved native save completed

The user explicitly approved the exact staged proposal ("It is ready to be saved"). On November 20, 2026, the agent rechecked the unchanged saved baseline and callouts, then clicked native Save and Keep Editing exactly once. An independent fresh editor load verified all activity/section text, timing, remarks and all six callouts against the scoped source package with zero mismatches. Both overviews match exactly. Only overview, studentOverview and activities differ at the top level from the baseline; all other saved fields are unchanged. Original activity and section identities are preserved.

Saved result: 3 activities, 10 sections, 6 callouts, 4 original existing levels and 3 assessment flags. New association IDs: 397404–397407; level IDs: 104255, 104271, 104272, 104273. The rendered lesson page independently shows the complete 45-minute teaching guide. Private evidence in the original Documents/ChatGPT workspace: native-teaching-saved-baseline.json, native-teaching-save-verification.json, native-teaching-saved-lesson.jpg. No retries or cleanup were performed.

This establishes the user-approved native UI save and saved readback for this proposal. The companion automatic end-to-end path and live cleanup remain separately unverified. A voice statement reporting a mismatch was incorrect; actual saved verification found zero mismatches and the user was corrected.

# Release delivery boundary

Release 0.10.2 code and tests committed as 641e673; the handoff checkpoint is 6f2f705. Both were successfully pushed to origin/main after the user completed the Git sign-in popup. The normal interactive push succeeded; the authentication blocker is resolved. All 168 regression tests pass.

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
