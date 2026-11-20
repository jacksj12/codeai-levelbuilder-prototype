# CodeAI Level Builder Prototype

Two delivery paths share a lesson review core:

- **Manual:** local editing, review, approval and export for manual entry in Level Builder.
- **API comparison:** a browser companion reads the assigned saved lesson and compares a review export. The native companion has a narrowly gated save path for explicitly approved existing-level additions. The four-link playground save passed live with independent saved readback and preservation checks.

## Run locally

Requires Node.js. No dependency installation or API key is needed.

```powershell
cd prototype
npm start
```

Open http://localhost:4316. Run `npm test` in the same directory for the 101 engineering checks.

## Project guide

- [Prototype setup and limitations](prototype/README.md)
- [Preview review implementation and test results](prototype/PREVIEW-REVIEW-ACCEPTANCE.md)
- [Transfer comparison and local rehearsal results](prototype/TRANSFER-REHEARSAL-ACCEPTANCE.md)
- [Native existing-field staging prototype](prototype/browser-fill/README.md)
- [API companion setup](prototype/api-companion/README.md)
- [Level Builder repository research](prototype/LEVELBUILDER-INTEGRATION.md)
- [Implementation scope](prototype/IMPLEMENTATION.md)
- [User profile, use cases and proposed acceptance tests](Claude-handoff-user-profile-and-tests.md)

The included lesson fixture contains curriculum source content and project-specific references. Keep this repository private. Official materials remain read-only. Local approval does not authorize a remote save. The comparison-only extension remains read-only. The native companion’s four-link approved write passed live; see its acceptance report for the restricted scope.

Engineering checks are not independent curriculum acceptance. No license to redistribute the included third-party curriculum is granted by this repository.
