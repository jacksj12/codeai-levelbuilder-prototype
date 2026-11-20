> Historical 0.9.0 evidence below. The current 0.10.2 scope, 168-test result, multi-callout guard and unsaved native-staging status are recorded in [activity transfer evidence](ACTIVITY-TRANSFER-ACCEPTANCE.md). No live saved acceptance is implied.

# Broader reviewed transfer — local acceptance

November 20, 2026. Companion 0.9.0. No live lesson writes, live cleanup, extension reload, commit or push were performed.

## Added support

Verified existing levels may be linked in newly appended sections. Approval includes level identity, assessment state, ordering and supported flags. Unit-conflict checks cover every proposed group. Saved readback requires fresh unique association IDs, rejects reuse of baseline IDs, and checks exact level mapping and flags. Cleanup uses the saved section identity from the verified receipt, removes its owned associations and retains the section, callouts and teaching changes.

Existing callout type/text are now reviewed scalar operations. Type names are readable in the UI and mapped to native values in the payload. Callout identities and unrelated metadata remain preserved. The native adapter validates the exact current tip, locates its mapped icon, verifies the opened dialog's initial type/text, edits one field and checks lesson content again immediately before applying. Outside edits or an unmapped dialog block the action. Automatic restoration uses exact captured checkpoints; it refuses unknown outside changes.

New activities, new callouts on existing sections, objective/vocabulary/resource collection changes and replacement of populated level progressions remain blocked. Legacy scalar-only tools reject callout changes before mutation; use the reusable transfer workflow.

## Source mapping

Public Code.org source inspected: [ActivitySectionCardButtons](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/ActivitySectionCardButtons.jsx), [EditTipDialog](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/EditTipDialog.jsx) and [LessonTipIconWithTooltip](https://github.com/code-dot-org/code-dot-org/blob/staging/apps/src/levelbuilder/lesson-editor/LessonTipIconWithTooltip.jsx). These establish the existing-tip edit trigger, type/text dialog and keyed updates. The deployed native editor has not been live-tested for this new path.

## Verification

Full suite: node --test --test-isolation=none => 153 passed, 0 failed. Nine additional tests cover new-section level identity/order/flags, duplicate usage, duplicate saved association IDs across groups, cleanup that preserves the section, existing-callout exact review, changed metadata refusal, outside-edit recovery and intentional blank text.

Native-shaped browser fixture: existing callout changed from Teaching Tip to Ethics Opportunity and received temporary text, then restored completely. Result passed-and-restored, saved=false, saveControlsInvoked=0. Repeated after adding the immediate precommit content check. This verifies the adapter against the local DOM fixture, not Code.org live.

Broader browser demo: six field changes including existing callout type/text; one new section with five callouts and an existing level; four total links/three assessments. Preparation restored the original synthetic editor. One simulated save verified and rechecked automatically. A separately approved simulated cleanup listed and removed all four owned associations, including the new section's level. It retained the new section and teaching edits. Reload and cleanup recheck completed without resend. Screenshot evidence is retained in the session visualization folder.

## Live-preparation boundary

No new destination-specific live package exists yet. The earlier Downloads review package remains the four-link package. Preparing the next real review needs a selected owned practice lesson and a fresh saved/editor baseline. Only after the exact request is displayed and approved may it be saved. Previously accepted live content remains unchanged. Live teaching/structural saves and live cleanup are still unaccepted; simulation must not be described as live acceptance.
