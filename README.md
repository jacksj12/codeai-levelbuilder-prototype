# CodeAI Level Builder Prototype

Lesson Studio turns normalized source JSON into a local lesson draft for preview, focused editing, issue flags, approval and export. The native browser companion prepares an exact destination review and supports a separately approved, guarded save. The API comparison extension is a separate read-only tool.

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

Latest delivery check: **174 passed, 0 failed**. These checks are not independent curriculum acceptance.

## Delivery guide

- [First use, demo walkthrough and capability limits](prototype/README.md)
- [Native companion installation, recovery and live-use boundaries](prototype/browser-fill/README.md)
- [Current handoff and retained historical evidence](NEXT-SESSION-HANDOFF.md)
- [Activity transfer checks](prototype/ACTIVITY-TRANSFER-ACCEPTANCE.md)
- [Read-only API comparison extension](prototype/api-companion/README.md)
- [Level Builder research](prototype/LEVELBUILDER-INTEGRATION.md)

The latest accepted live result is a user-approved **native UI save** of the complete AI Lab proposal, independently read back with zero mismatches. It contains three activities, ten sections, six callouts and four original level links, three marked assessment. This does not establish automatic end-to-end acceptance of the reusable companion or live cleanup. Preserve that accepted lesson; no further save or cleanup is authorized by these instructions.

The source fixture includes curriculum content and project-specific references. Keep the repository and downloaded reports private. Official sources remain read-only. Local approval does not authorize a remote save. No license to redistribute third-party curriculum is granted here.
