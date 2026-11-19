# Lesson Studio — independent prototype

Two delivery versions now share the same lesson draft and review package:

- **Manual / no Level Builder API:** this local app, with editable review and copy/export for manual entry.
- **API comparison prototype:** `api-companion/`, an unpacked Chrome/Edge extension that reads the assigned saved lesson and compares it to the exported review package. No remote save is implemented; authenticated browser verification and destination mappings remain outstanding. See its README for setup and limits.

Run `npm start` inside this directory, then open http://127.0.0.1:4316. Requires Node.js; no packages or API keys required. Run `npm test` for engineering regression tests.

The first version includes the inspected AI Lab source snapshot. Review front matter, teaching sections, callouts, resources and linked-level metadata. Edit right-hand fields, mark each item reviewed, and approve locally to establish a baseline. Export Markdown for copying/review or JSON to preserve structured records. No external write or publish endpoint exists.

Use Import sources to download the source template or import a revised JSON package. It needs a title, stable unique slide ids, slide numbers, notes, and optional front matter/resource/level-association fields shown in the template. Source JSON is distinct from exported review JSON. Live Slides/Notion link import is not implemented. Do not paste credentials into the app.

Regeneration compares the prior source-derived output with your current draft and new source-derived output. Local edits survive unchanged source; conflicts and incoming deletions require a choice. Local approval is not an independent curriculum signoff and does not publish to Level Builder. Direct reading of current destination content is not integrated.

Browser storage persists drafts and local approvals. Export backups before clearing browser data. The source snapshot is read-only; reset affects browser state only. The preview is not an exact Level Builder renderer: icon placeholders are shown and Markdown support is limited. Remarks flags are stored but their Level Builder rendering has not been tested.

Current sandbox: https://levelbuilder-studio.code.org/courses/6-12-dev-playground/units/16/lessons/11 . The previous sandbox is not used. Ask before any future sandbox save. All official sources remain read-only.

Not yet implemented: direct authenticated source import, full destination-aware three-way revisions, automatic publishing, AI interpretation, adding/reordering activities and callouts through UI, source-rich text fidelity beyond the supported marker conversion, or cross-curriculum validation. Generic JSON import is available but requires normalized source preparation.

Tests are engineering checks from observed facts and proposed requirements, not independently approved gold outputs. See IMPLEMENTATION.md for scope and iteration limits.
