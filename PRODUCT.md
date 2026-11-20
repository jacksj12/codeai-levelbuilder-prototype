# CodeAI Level Builder Prototype

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

CodeAI curriculum developers creating student-facing lessons and professional-learning developers/managers creating teacher-facing experiences. Technical experience varies; setup and review should be understandable without specialist knowledge.

## Product Purpose

Turn existing lesson sources into complete, reviewable Level Builder lessons with less reentry, fewer omissions, correct resource links and audiences, and human review before remote changes. Primary source materials include Slides speaker notes, Notion lesson briefs and supporting resources.

## Operating Context

Work one lesson at a time. Review the assembled lesson first, flag problems, edit the affected section, resolve blockers, and approve the result. Keep source comparison available without forcing it into every review. Preserve local edits and distinguish local approval from remote-save authorization.

The active checkout is C:/Users/Jackson Work/Documents/GitHub/codeai-levelbuilder-prototype. The ChatGPT project folder is a backup. Run npm start from prototype; the default local preview is http://127.0.0.1:4316. Verify the serving directory before evaluating changes.

## Capabilities and Constraints

The existing app uses dependency-free browser JavaScript and a Node.js local server. No runtime AI calls or API keys are required for the local review workflow.

Repository evidence at initialization (November 20, 2026): local review/editing, preview and flag workflows, structured comparison and Markdown/JSON exports exist. Source import expects normalized JSON; direct authenticated Slides/Notion import and whole-workspace restoration from review exports remain gaps.

Two integration paths must remain distinct: the API comparison extension is read-only; the native companion supports bounded staging and a narrowly gated save workflow. Documented saved acceptance covers a four-existing-level-link request, not general lesson publishing. The reusable workflow has local/demo verification; broader live acceptance remains pending. Consult current acceptance reports before making capability claims.

Official curriculum and source documents remain read-only. Remote saves require explicit authorization for the exact proposed change and a confirmed user-owned practice destination. Preserve destination content and identities, check fresh baselines, retain restore evidence, and never automatically resend an ambiguous save. Prior approval is not blanket permission for future writes.

Keep this repository private. Do not commit private capture, review, job or authorization data. Included third-party curriculum is not licensed for redistribution by this project.

## Evidence on Hand

- Claude-handoff-user-profile-and-tests.md: user profile, source mapping and proposed acceptance criteria.
- NEXT-SESSION-HANDOFF.md: evolving implementation status, acceptance limits and next work.
- prototype/README.md and acceptance reports: implemented workflows and recorded checks.
- Included AI Lab fixture: initial curriculum example; broader curriculum compatibility must not be claimed without verification.

Engineering tests, live unsaved checks, saved readback and independent curriculum acceptance are distinct kinds of evidence. Do not describe proposed tests or demos as live acceptance.

## Product Principles

1. Put the assembled lesson and actionable review issues first.
2. Preserve user edits and existing destination content; make conflicts and blockers explicit.
3. Keep resource identity, audience, instructional structure and source fidelity visible.
4. Require deliberate approval for remote changes and make progress and recovery understandable.
5. Describe capabilities and verification honestly, with clear boundaries between local, simulated and live behavior.

## Open Decisions

Product-specific accessibility requirements, supported operating systems and organizational sign-in constraints remain unconfirmed. Do not invent requirements or compatibility claims. Visual redesign is outside this initialization task.

## MVP review emphasis

The assembled lesson should emphasize reading, flagging issues and approval, without promoting direct editing or adding new content. Keep authoring capabilities available in the existing editors for supporting additions such as teacher-facing images. Exact identity with slide notes is not required; this is a presentation priority, not a prohibition on supplementary content. Confirmed November 20, 2026.

## Repeat-test lifecycle

The test workflow should include cleanup of level associations from prior owned practice runs. Remove links, never underlying levels; retain fresh recovery evidence, preserve unrelated content, review exact saved changes and independently verify cleanup before reuse. Do not shift repeated manual unlinking to the user. Receipt-owned saved cleanup is implemented and simulation-tested; live acceptance remains pending. Full workspace backups restore into a separate workspace, preserving the original.
