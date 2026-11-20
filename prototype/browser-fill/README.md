# Browser transfer companion — supported native transfer prototype

This non-API transfer path has a tested local rehearsal runner and a restricted native existing-field adapter. Full native lesson import and all remote saving remain unavailable. It is separate from `api-companion`, which reads through the authenticated lesson editor endpoint. See [native adapter evidence and limits](../NATIVE-SCALAR-ACCEPTANCE.md).

## Local comparison and rehearsal

Run the prototype server from this clone. Open `transfer.html`, or choose Transfer review in the lesson workspace. Load an approved review package, then choose Create isolated local rehearsal. Review proposed actions, stage with a small action limit, reload and resume. A completed rerun detects already-present content. The page explains that its generic DOM editor and catalog are synthetic.

Paste a native page capture into Transfer review for read-only comparison there. Supported native staging is available only through the separate companion popup described below. Missing resource/level mappings and unsupported native actions block the whole native run rather than being skipped. No plan creates shared records or uploads assets.

Comparison state is stored under `lesson-transfer-v1`, separately from the review editor. Download comparison and recovery evidence before clearing browser storage. Recompare current local editor retains outside edits and previous reports; starting a new comparison requires an explicit reset confirmation. The report export includes the approved package and destination evidence and should stay private.

## Native companion setup and review

In Chrome or Edge, choose Load unpacked and select the **parent `prototype` directory**, which contains the root `manifest.json`. Do not select this subdirectory. This does not replace the separate API companion extension.

Open the already signed-in assigned playground editor and choose Read / recompare current editor. Paste an approved review package into the popup, choose Load review package, and inspect every proposed action. Choose explicitly whether to keep or replace nonempty current content. Preserve intentional current sandbox naming rather than blindly replacing it from an older export.

The popup only enables Stage reviewed changes when every mapping, approval and capability check passes. Supported actions are existing title/front-matter text, activity title/whole-minute timing, and section title/whole-minute timing/guidance/remarks. Appending empty sections and all five callout types is also supported, followed by reviewed section fields. Activity creation, objective/vocabulary changes, edits to existing callouts, resource/level associations and other unsupported operations block the entire run. Source lesson database identities are not reused. Save, resource creation and asset uploads are absent.

Use a small action limit for initial native verification. Stop leaves existing unsaved changes intact. Checkpoints survive popup closure through local extension storage. If the native page is reloaded and unsaved changes disappear, the adapter refuses blind replay and requires recomparison. Downloaded evidence includes private curriculum and should remain private.

The exact host, assigned aliases, lesson identity, current field values, matching serialized state, open dialogs/inline edits and unrelated native settings are checked before mutations. No endpoint is fetched by this adapter. Existing-field actions use native control events; no private React store or hidden-input value is written.

The user installed the extension in Edge and completed a live read and one unsaved title write. The exported report confirmed one completed action and no save; the user confirmed reloading removed the marker. The actual function passed native-shaped local DOM tests, and separate agent-operated unsaved native UI checks were restored and verified after reload. These are distinct evidence, not full native acceptance. See [native adapter results](../NATIVE-SCALAR-ACCEPTANCE.md), [local rehearsal results](../TRANSFER-REHEARSAL-ACCEPTANCE.md) and [native acceptance status](../BROWSER-FILL-ACCEPTANCE.md).

## Automatic engineering verification

Open the assigned editor and choose **Run automatic unsaved check and restore**. The updated companion launches a dedicated extension tab; keep that tab and the editor open. The popup can close. The run checks all 12 supported existing field classes, resumes, repeats without duplicate writes and restores the originals. It then creates one temporary section, fills it, adds all five native callout types and removes the temporary section. It downloads evidence automatically, and clears stale comparison packages. No extra permissions or remote Save operation were added. Unknown outside edits stop cleanup instead of being overwritten.

The earlier two-field automatic suite passed a live Edge run. The combined twelve-field and five-callout structural suite passed live in Edge, including restoration. The same reviewed transfer runner passed a live 1-of-10 bounded segment, resume to 10, duplicate-free rerun, and complete restoration. The transport now has a 15-second timeout and automatically activates the verified assigned editor to recover from browser freezing; discarded tabs are refused. These engineering checks do not implement full native lesson import.

## Approved existing-level rehearsal

The native adapter can resolve exact names in the existing-level picker and link them into an empty progression, including reviewed assessment flags. It never uses Create New Level or Copy, and never writes source database identities. The popup offers Verify existing level mappings before reviewed staging. The automatic controller also rehearses the locally approved package from the ignored accepted-rehearsal.json, preserves the current playground title, rejects other content decisions, and removes only its exact newly staged associations afterward. Saved associations cannot be removed by this cleanup. The complete accepted-package level path passed live in Edge with 3 activities, 10 sections, 6 callouts, 3 resources, 4 level links and 3 assessments. One group was staged, the second resumed, a rerun made no new associations, and the complete original capture was restored. No lesson Save was performed.


## Explicit approved save job

The parent companion can complete a separately approved four-link playground save using an ignored local job. When that mode is active, the popup button reads **Complete approved four-link save**, and the controller is labeled **Approved four-link save**. It is not an unsaved test. Ordinary Stage reviewed changes remains unsaved. The controller preserves the original snapshot, sends at most one approved request, reads the saved lesson back, then stops. An uncertain outcome is never automatically retried. The first live write remains unconfirmed; see ../NATIVE-SCALAR-ACCEPTANCE.md for status and recovery details.


### Verified save result

The approved original-four-link save completed live with HTTP 200 after the user freed the original levels from the other playground lesson. All four links and three assessment flags passed report readback and a separate authenticated reload, with all other saved data preserved. Continuation is stopped and a repeated launch reads the result without sending another PUT. The successful receipt and both original/post-save restore points are retained privately in Documents/Lesson Studio Checks. Reopen the saved editor before further manual editing so its native baseline includes the saved associations. This is a restricted save path, not a general-purpose publisher.


### Git handoff default

Version 0.4.0 uses the verification-release revision: ordinary unsaved field and temporary-section/callout checks only. It does not load a personal accepted package or execute an approved-save job. Those ignored files remain local for evidence and recovery. Configuring another accepted-package rehearsal or save is separate work, with fresh destination review and authorization. No extension permissions changed.
