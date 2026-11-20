Current follow-up: companion 0.9.0 also supports verified levels inside new sections and existing callout type/text edits. See [broader transfer acceptance](BROADER-TRANSFER-ACCEPTANCE.md). The scope below records the earlier structural milestone.

# Append-only structural transfer — local acceptance

November 20, 2026. Companion 0.8.0. No live lesson writes, live cleanup, extension reload, commit or push were performed.

## Scope

Reviewed new sections may append to existing activities. New sections include title, guidance, positive whole-minute or blank timing, remarks and all five callout types. Existing teaching-field edits and existing-section level additions may be included in the same exact review. New activities, edits/appends to existing callouts, level links inside new sections and shared collection mutations remain blocked before any staging.

Complete existing native records and unknown settings are retained. Each new-section request omits source IDs and temporary editor keys, supplies the reviewed one-based position and teaching fields, and contains no level associations. Callouts carry only reviewed type and markdown. Restaging can generate different UI keys without altering the approved request. Saved readback requires new positive unique section IDs, exact new-section content, exact old identities and unchanged unlisted data.

## Server mapping evidence

The public [LessonActivity model](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/models/lesson_activity.rb) creates sections when no persisted ID is supplied and replaces section associations from the entire input list. The [ActivitySection model](https://github.com/code-dot-org/code-dot-org/blob/staging/dashboard/app/models/activity_section.rb) returns section IDs/positions/teaching fields and callout data. Inspected revisions: LessonActivity 61a5c192e824c55ce6f9c32acef7a8d225a094a0 and ActivitySection 2028a282428a9da13756715c85279c7dcea59b31. Public source is mapping evidence, not proof of the deployed server revision or live acceptance.

## Automated checks

Full regression command: node --test --test-isolation=none. Result: 144 passed, 0 failed.

Nine new tests exercise exact approval, unchanged request digest across new temporary keys, generated section IDs, rejection of missing/reused/duplicate IDs, altered callouts/unmapped settings, complete-batch rejection for unsupported operations, failed-prefix recovery, outside-edit refusal, lost removal acknowledgement recovery, scalar-recovery continuation after removing new sections, multiple new sections in one activity, structure-only requests and mixed cleanup preservation.

Recovery uses retained full captures and generated keys to establish ownership before removing an appended unsaved suffix. It validates complete captures after each removal. Once appended sections are gone, existing scalar/link recovery validates and restores its own known checkpoints. Unknown edits remain untouched. Missing evidence blocks recovery rather than guessing ownership.

## Browser simulation

A separate run on http://127.0.0.1:43831/workflow.html loaded the section-and-callout demo. Review showed an Evidence reflection section, four minutes, remarks enabled and all five callout bodies, alongside four teaching changes/four links/three assessments. Preparation restored the original synthetic editor. One simulated save passed independent readback and automatic recheck. Reload plus manual recheck retained a count of one request. The existing user demo and live lesson were not modified. Screenshot retained in the session visualization folder.

## Remaining work

Live teaching-field/structural acceptance still needs a selected owned practice destination, a package prepared for its current baseline, exact approval and independent saved verification. Receipt-owned live cleanup also remains unaccepted. The earlier Downloads lesson-review package is the four-link package, not a prepared live teaching/structural test. Next mappings: levels within new sections and mutations of existing callouts, then new activities and shared collections. Link cleanup retains teaching changes and new sections; no whole-lesson restore is implied.
