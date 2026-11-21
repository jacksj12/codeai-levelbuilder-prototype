# CodeAI Level Builder Prototype

Lesson Studio turns Slides PowerPoint exports, Notion briefs and normalized source JSON into a local lesson draft for preview, focused editing, issue flags, approval and export. The native browser companion prepares an exact destination review and supports a separately approved, guarded save. The API comparison extension is a separate read-only tool.

## Start here

Requires Node.js; no dependency installation or API key is needed.

```powershell
cd prototype
npm start
```

Open [Lesson Studio](http://127.0.0.1:4316) for local review, or the [isolated transfer demo](http://127.0.0.1:4316/workflow.html). The demo uses synthetic destination data and makes no live changes. If the port is occupied, set `$env:PORT='43834'` before starting and use that port. Startup prints the served folder; verify it is this checkout's `prototype/dist`.

Run the engineering checks from `prototype`:

```powershell
node --test --test-isolation=none
```

Latest checkpoint: **0.15.0, 287 tests passed, 0 failed**. Shared-resource/vocabulary create-or-reuse review and guarded association publishing are implemented with automated coverage; live acceptance of the new path remains pending. The complete publishing build is still unfinished. See [the handoff](NEXT-SESSION-HANDOFF.md) for remaining scope. These checks are not independent curriculum acceptance.

Release **0.12.0** adds combined source imports and a read-only signed-in Slides import control. File imports were checked against the real source deck and Notion brief. Installed-extension reload and live workflow acceptance remain blocked by browser access policy.

## Delivery guide

- [First use, demo walkthrough and capability limits](prototype/README.md)
- [Native companion installation, recovery and live-use boundaries](prototype/browser-fill/README.md)
- [Current handoff and retained historical evidence](NEXT-SESSION-HANDOFF.md)
- [Activity transfer checks](prototype/ACTIVITY-TRANSFER-ACCEPTANCE.md)
- [Read-only API comparison extension](prototype/api-companion/README.md)
- [Level Builder research](prototype/LEVELBUILDER-INTEGRATION.md)

Release **0.11.0** adds native-editor save dispatch, field-level source revisions, activity/section ordering and concurrent-tab recovery. The four original levels are now independently verified in lesson **8898984** after the one separately approved native save.

The latest accepted live result is a user-approved **native UI save** of the complete AI Lab proposal, independently read back with zero mismatches. It contains three activities, ten sections, six callouts and four original level links, three marked assessment. This does not establish automatic end-to-end acceptance of the reusable companion or live cleanup. Preserve that accepted lesson; no further save or cleanup is authorized by these instructions.

The source fixture includes curriculum content and project-specific references. Keep the repository and downloaded reports private. Official sources remain read-only. Local approval does not authorize a remote save. No license to redistribute third-party curriculum is granted here.


### Saved destination revision review

Revision review can link a native saved report to an exactly matching approved local baseline, then compare newer saved reports by native activity and section identities. Independent changes merge into the local draft; conflicting edits, cleared text, and deleted activities require decisions. Repeating a report retains prior decisions. Source revision tracking remains independent. This workflow reads downloaded evidence only and never stages or saves the destination. Saved settings outside the draft are reported and preserved. Reports must be a clean baseline capture or an independently verified successful save; mismatched baselines and destinations are refused.
