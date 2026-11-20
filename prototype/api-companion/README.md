# API version — comparison build

This is the second delivery path for the same Lesson Studio draft. The manual version in `dist` remains independent: review, edit, export and copy content into Level Builder. It needs no Level Builder connection.

This Chrome/Edge extension reads the assigned lesson through the authenticated editor endpoint, imports the same JSON review export and displays current versus proposed front matter. It retains the complete saved lesson in the downloaded comparison. It does not implement PUT, save or publishing. It is an API integration prototype, not a verified public API client or a completed automated importer.

## Try the companion

1. In Chrome or Edge, open the extensions management page, enable Developer mode and choose Load unpacked. Select this `api-companion` directory.
2. Sign in to Level Builder normally in that browser. Open the assigned Julian Playground – ChatGPT lesson. The extension uses temporary access to the active tab, not copied credentials.
3. Open the extension and choose Read assigned lesson. Choose the JSON review package exported by Lesson Studio.
4. Review the comparison and its blockers. Download it before closing the popup; loaded data is held only in memory.

The assigned lesson is https://levelbuilder-studio.code.org/courses/6-12-dev-playground/units/16/lessons/11 ; verified database lesson ID is 8898985. The canonical edit alias is `/s/scottsdale-levelbuilder-exploration/lessons/11/edit`. Other lessons are rejected. The GET request follows no redirects and fails closed if the returned identity or editor format differs. It reads saved data, not unsaved form edits.

## Current verification and remaining work

Automated checks cover shared lesson content, destination restrictions, GET-only behavior, retained destination records and mapping blockers. Extension installation and authenticated connection have NOT been tested in Chrome/Edge. Repository evidence is from the current default branch and can differ from the deployed site.

Before supporting saves: resolve destination-specific resources, objectives, vocabulary and level records; preserve and merge all existing activities/sections/level links; serialize exactly as the deployed editor does; compare a fresh saved snapshot immediately before writing; include originalLessonData for the server conflict check; obtain explicit user authorization for the concrete changes; verify the saved result. Do not copy source lesson database IDs to this destination. Local draft approval is not authorization to save remotely.

Sources: [editor bootstrap](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/views/lessons/edit.html.haml), [lesson controller](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/controllers/lessons_controller.rb), [Chrome temporary active-tab access](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab), [Chrome script execution](https://developer.chrome.com/docs/extensions/reference/api/scripting). Further endpoint evidence is in `../LEVELBUILDER-INTEGRATION.md`.

## Reviewed-save dry run

The parent native companion now has a pure request-review builder in ../dist/save-review.mjs. It uses the completed accepted-package native rehearsal and a fresh saved snapshot, retains the server's exact original JSON for its order-sensitive concurrency check, starts from the complete saved destination, and applies only the two reviewed additions of existing level links. It preserves destination IDs, all other activities and sections, objectives, resource/vocabulary keys, standards, code definitions, announcements, teaching concepts, unrelated settings and unknown saved data. Nullable untouched fields are retained rather than replaced by editor display defaults.

Reviews have an integrity digest, a ten-minute freshness window and a required fresh saved-data recheck. The pure readback verifier checks expected content/flags/ordering, native level-record IDs, generated association IDs and preservation outside the reviewed groups. Tests cover stale/tampered/expired reviews, wrong targets, missing mappings, full-collection preservation, raw original JSON order and readback mismatches. No PUT transport is implemented or invoked. A successful dry run is not authorization to save and does not validate the deployed write response.


The comparison-only extension described above still makes GET requests only. The separate parent native companion now contains an explicitly approved save transport for the four-link playground job. Its first live write is queued, not confirmed. See ../NATIVE-SCALAR-ACCEPTANCE.md.


Final update: the parent native companion’s four-link original-level save passed live with HTTP 200 and independent full saved readback. This subdirectory’s comparison extension is still read-only.
