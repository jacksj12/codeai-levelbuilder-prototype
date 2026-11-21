# Live acceptance update — November 21, 2026

The user-operated **0.15.2** companion path passed on lesson **8898985**: shared records 13894640 / 3106086, exact two-association rehearsal and restoration, separately approved native save, independent readback with zero mismatches and automatic no-resend recheck. Removing only those associations recreates the entire original saved baseline exactly. The test associations remain saved; protected lesson 8898984 remains untouched. This supersedes the pending-live status below for this specific path.

Source 0.15.3 additionally fixes stale error/recovery labels after successful saves, with retained historical errors and regression coverage. No repeat live test is necessary for the already verified 0.15.2 result. See the current handoff for scope and evidence boundaries.

# Shared-record validation — source 0.15.1

The new shared-record create/reuse and lesson-association workflow has completed its deferred local checks. Live installed-companion acceptance remains pending; the full historical publishing roadmap is not complete.

| Layer | Executed evidence | Boundary |
| --- | --- | --- |
| Shared-review controller | Four tests use the real screen handlers for approval, reload/recheck, retained uncertain attempts, package replacement, stale baselines and storage failure. | Simulated Chrome boundary. |
| Native search and selection | Six tests run the real serialized bridge with native-shaped DOM fixtures for resources and vocabulary. Duplicate catalog labels, duplicate options, capped/missing searches, outside edits and repeat association stop safely. | No deployed network or installed extension. |
| Rehearsal restoration | Real serialized association selection → known checkpoint → native reload authorization → exact original capture readback for both collections. No-op selection and outside edits cannot invent success or authorize destructive recovery. | Simulated tab reload and fresh server response. |
| Browser review | Actual workflow HTML/CSS/controller with a synthetic native boundary. Expanded details survive approval; keyboard Space/Tab/Enter reaches creation and continuation; synthetic creation and read-only recheck complete. No error logs. | Temporary loopback fixture, not a shipped alternative writer. |
| Responsive review | Inspected at default size and 390 × 844. At 390 pixels the document width was 375 pixels; viewport override reset afterwards. | Two observed sizes, not exhaustive device coverage. |
| Regression | 297 tests passed, zero failures. Distribution keeps activeTab/scripting only and unarmed verification mode. | Engineering checks, not independent curriculum approval. |

Two defects were reproduced and fixed: selecting among records with identical labels could hide a different identity outside the seven displayed native options; review refresh/approval replaced expanded details and keyboard focus. The scoped search now requires one matching label across its complete bounded result, and a stable review retains its DOM nodes.

## Live test handoff

The user chose unit 16 / lesson 11; its native editor identifies lesson **8898985**, named Julian Playground - chatGPT(Cleared), with existing teaching content. Protected lesson **8898984** remains untouched. The selected destination authorization does not authorize unspecified shared-record creation or another lesson save.

The agent's extension-page access was denied by browser URL policy. No workaround, extension reload, shared-record creation, staging or live save was attempted after that denial. Source version is **0.15.1**; installed version remains last verified at **0.12.3**.

1. Download any retained companion reports before reloading the existing unpacked companion from the parent prototype folder.
2. Open `https://levelbuilder-studio.code.org/lessons/8898985/edit`, then open a fresh reusable transfer screen. Confirm the practice destination and source version 0.15.1.
3. Choose **Read baseline only and download report**. Keep the report private, outside Git. No package or staging is needed for this step.
4. Use that fresh baseline to prepare a minimal test package retaining every existing field/record. Review the exact new resource/vocabulary names, metadata and course scope before separately approving creation.
5. Verify create/reuse results, continue to the separate lesson review, confirm rehearsal restoration, then review the exact association changes before any save. Rechecks must remain read-only; no second dispatch may occur. Keep the independent saved readback report.

Never use native vocabulary Delete as rehearsal cleanup; it permanently deletes a shared record. Record deletion, existing-content removal, populated progression replacement/reordering, asset uploads and production destinations remain blocked.
