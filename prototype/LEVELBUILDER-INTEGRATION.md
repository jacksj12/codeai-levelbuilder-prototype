# Level Builder integration investigation

Inspected November 19, 2026, using the official code-dot-org/code-dot-org repository's staging branch. These are source-code findings, not a successful live API integration. No remote writes were attempted. The deployed Level Builder version may differ from staging.

## Conclusion

There is an internal structured lesson save endpoint used by Level Builder itself. This is a promising integration path, but the inspected files do not establish a supported public third-party authoring API or API-key authentication flow. Keep the current prototype write-disabled until live read mapping and preservation tests are complete.

## Verified entry points

| Purpose | Interface | Evidence |
|---|---|---|
| List lesson ids/names | GET /s/:script_name_or_id/lessons or course/unit lesson collection | LessonsController#index renders JSON |
| Read editor data | GET /lessons/:id/edit or unit/lesson-position edit URL | Controller builds summarize_for_lesson_edit; edit template embeds lesson and unit JSON in script data attributes |
| Save lesson | PUT /lessons/:id (Rails also routes PATCH for update) | LessonEditor.handleSave sends JSON; LessonsController#update processes it and returns summarized editor JSON |
| Level information | GET /lessons/:id/level_properties and course/unit variants | Useful lab-level summaries, not a substitute for complete authoring data |
| Find/create/update resource records | GET /resources/search; POST /resources; PATCH/PUT /resources/:id | Routes and ResourcesController; resources belong to a course version |
| Vocabulary records | GET /vocabularies/search; POST /vocabularies; PATCH/PUT /vocabularies/:id; DELETE supported by routes | Route inspection only; no mutation or detailed vocabulary-controller validation performed |

## Authentication and concurrency

The controller uses resource authorization and requires Level Builder mode (or test environment) for editing/updating. Ability rules give persisted users with Level Builder permissions curriculum-management abilities in those environments. ApplicationController enables CSRF protection. This supports a signed-in editor/session integration hypothesis; it does not prove that a separate-origin webpage can call these endpoints. CORS, session transport, approved external-client authentication, and production support policy remain unverified.

The editor sends originalLessonData as serialized JSON. The server compares it with current summarized lesson data and rejects stale changes. Preserve that mechanism; do not omit it to bypass conflict detection. Re-read immediately before a future approved save and report any conflict rather than automatically retrying a stale request.

## Payload and preservation requirements

The outer request is JSON, but several fields are JSON-encoded strings: objectives, activities, resource keys, vocabulary keys, standards, announcements, and originalLessonData. Existing display and persisted field names differ. Activity serialization converts displayName to name, text to description, and script-level position to activitySectionPosition, while stripping client-only keys.

Resources are resolved by key inside the destination lesson's course version. Merely providing a resource name and URL in the lesson save is insufficient. Resource creation/update is a separate operation, and updating a shared resource can affect multiple lessons. Prefer inspecting/reusing appropriate destination records; never modify an official shared resource to correct a sandbox-only link.

Critical deletion behavior in the models:

- Replacing activities deletes omitted activities.
- Replacing activity sections deletes omitted sections.
- Replacing script-level collections deletes omitted level associations.
- Missing scriptLevels inside a submitted section defaults to an empty collection.
- The lesson controller assigns resource/vocabulary/standard collections; missing arrays can clear associations.

Consequently, a minimal partial save is unsafe. Build a complete destination snapshot, preserve unknown settings and existing record identities, and apply explicit reviewed edits to it. Source lesson ids must not be reused as destination identities. Never infer a database lesson id from its visible lesson number.

## Next implementation checks

1. Read the assigned sandbox's editor data and verify its database lesson identity and course-version context without saving.
2. Build a pure request adapter with no networking; compare its serialization with the official editor.
3. Test preservation of every existing activity, section, level association, objective association, resource, vocabulary, standard, and unrelated setting. Test empty-field and deletion conflicts explicitly.
4. Enforce the exact sandbox host plus resolved database identity, not only a string URL check. Official URLs, aliases, redirect targets, and unknown identities must fail closed.
5. Determine the approved authenticated integration mechanism. A same-origin extension or an internal Code.org integration may fit better than a standalone static page; this is a hypothesis pending verification.
6. Present the complete proposed change and request authorization before any sandbox save. Verify saved readback after authorization.

## Sources

- [Routes](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/config/routes.rb)
- [Lesson controller](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/controllers/lessons_controller.rb)
- [Editor save request](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/LessonEditor.jsx)
- [Activity serialization](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/activitiesEditorRedux.js)
- [Edit view data](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/views/lessons/edit.html.haml)
- [Lesson model](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/models/lesson.rb)
- [Lesson activity model](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/models/lesson_activity.rb)
- [Activity section model](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/models/activity_section.rb)
- [Resource controller](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/controllers/resources_controller.rb)
- [Authorization rules](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/models/ability.rb)
- [Application controller / CSRF](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/controllers/application_controller.rb)
