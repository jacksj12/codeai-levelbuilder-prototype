# First implementation contract

Second batch, requested by the user: separate manual and API delivery paths using the same generated lesson. Bound this first API slice to a read-only browser companion and comparison, at most 30 minutes and 3 repair cycles. No remote saves, installation or runtime AI calls. Full write integration remains a subsequent verified slice, with explicit user authorization before any save. The API companion is not yet live-browser verified.

Scope: local browser review prototype, complete AI Lab fixture, editable front matter and teaching sections, structured resources/callouts/level associations, source comparison, approval baseline, safe regeneration, JSON and Markdown exports. No publishing or external write code. Generic import uses the documented JSON source format; direct authenticated Notion/Slides import is a later integration.

Tests were written before implementation from observed source facts and proposed acceptance criteria. They are engineering regression checks, not independently approved gold-standard tests. Human curriculum review remains outstanding.

First implementation batch limits: 30 minutes, at most 3 repair cycles. No runtime AI calls: zero runtime AI tokens/cost. No spawned agent loop. Development chat token billing is not observable/enforceable by this app; do not claim a measured development-cost cap. A future autonomous agent runner remains disabled until explicit token and monetary limits can be enforced.

Architecture: dependency-free browser modules and a local static server. Deterministic transformations retain source IDs and structured records. No source credentials are stored. Lesson content stays in browser storage until a user exports it. This is a reversible first slice, not a final platform decision.

Guidance consulted: https://developers.openai.com/codex/learn/best-practices and https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex — specify outcomes, constraints, verification, and bounded iteration before implementation.

Assigned sandbox: https://levelbuilder-studio.code.org/courses/6-12-dev-playground/units/16/lessons/11 . This replaces the earlier sandbox for this independent implementation. Claude uses a separate sandbox. Any future save requires explicit approval. Do not use the earlier sandbox for this app.
