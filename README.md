# CodeAI Level Builder Prototype

Two delivery paths share a lesson review core:

- **Manual:** local editing, review, approval and export for manual entry in Level Builder.
- **API comparison:** a browser companion reads the assigned saved lesson and compares a review export. Remote saving is not implemented.

## Run locally

Requires Node.js. No dependency installation or API key is needed.

```powershell
cd prototype
npm start
```

Open http://localhost:4316. Run `npm test` in the same directory for the 15 engineering checks.

## Project guide

- [Prototype setup and limitations](prototype/README.md)
- [API companion setup](prototype/api-companion/README.md)
- [Level Builder repository research](prototype/LEVELBUILDER-INTEGRATION.md)
- [Implementation scope](prototype/IMPLEMENTATION.md)
- [User profile, use cases and proposed acceptance tests](Claude-handoff-user-profile-and-tests.md)

The included lesson fixture contains curriculum source content and project-specific references. Keep this repository private. Official materials remain read-only. Local approval does not authorize a remote save. The API companion still requires authenticated browser verification and destination mapping before write integration can be completed.

Engineering checks are not independent curriculum acceptance. No license to redistribute the included third-party curriculum is granted by this repository.
