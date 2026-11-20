Method: dual-agent (A: /root/design_review · B: /root/evidence_review)
# Lesson Studio interface critique
Source-grounded UX assessment with rendered detector evidence; visual composition and interaction behavior were not directly inspected. Primary target: prototype/dist/index.html; supporting target: workflow.html.

## Design health
| Heuristic | Score /4 | Key issue |
|---|---:|---|
| System status | 3 | No persistent normal autosave confirmation |
| Real-world match | 2 | JSON and implementation terminology |
| User control | 2 | No app-level undo |
| Consistency | 3 | Transfer review vs demo unclear |
| Error prevention | 3 | Strong blockers and deliberate approval |
| Recognition | 3 | Long preview lacks section outline |
| Efficiency | 2 | Repetitive controls and navigation |
| Minimalism | 2 | Authoring competes with reading |
| Error recovery | 2 | Raw parser errors; storage startup unguarded |
| Help | 2 | Source preparation requires outside knowledge |
| Total | 24/40 | Acceptable; significant improvement needed |

## Design specificity and overall impression
The product-specific system is coherent: teacher/student distinctions, audience-aware resources, source preservation, flags and separate local/remote approvals serve actual curriculum work. The source defines a conventional teal sidebar/card system; visual execution remains unverified. The biggest opportunity is making review and correction usable without understanding structured data.

## What works
- Preview-first review, contextual Edit/Flag actions and optional source comparison.
- Navigable blockers and retained resolved history.
- Explicit simulated-save and remote-approval boundaries, with no automatic resend after uncertain results.

## Priority issues
1. [P1] Technical correction paths exclude mixed-technical users. Resource edits require JSON; import expects normalized JSON; teaching guidance exposes Markdown/icon HTML. Use labeled resource rows and guided import, retaining advanced raw editing secondarily. Locations: prototype/dist/app.mjs:51,63; index.html:6. Command: impeccable onboard.
2. [P1] Applied edits lack a clear reversal path. Immediate autosave and removed conflict decisions have no app-level undo. Add reversible field/section edits and undo for conflict resolution without silently discarding newer work. Location: app.mjs:106,109. Command: impeccable harden.
3. [P1] Small text fails contrast. Sidebar paragraphs are 2.7:1 and footer text 4.0:1, below 4.5:1. Correct shared tokens and sidebar overrides. Location: style.css:1. Command: impeccable harden.
4. [P2] Repeated authoring tools disrupt assembled review. Each section offers Edit, Flag and seven insertion controls. Collapse insertion into Add content or move it to editing mode. Locations: review.mjs renderLesson; content-ui.mjs:5-6. Command: impeccable distill.
5. [P2] Competing completion signals and transfer status add uncertainty. Optional checkmarks occupy a top metric; overall approval uses blockers instead. Transfer steps are CSS-only, and ten-minute expiry is static prose. Prioritize blockers/overall state, add semantic current-step state and visible expiry/reprepare guidance. Locations: app.mjs:28-36; workflow-app.mjs:17,38. Command: impeccable clarify.

## Cognitive load and emotional journey
The source suggests four of eight cognitive-load checks fail: multiple simultaneous purposes, excessive section choices, weak progressive disclosure and competing review signals. Grouping and contextual editing reduce memory demands. Users begin with reassurance and an assembled lesson, encounter friction in technical correction and transfer terminology, then regain confidence from flags, explicit approvals and verified-result messaging. These are expert hypotheses, not observed user-test results.

## Persona red flags
- First-time curriculum reviewer: can read and flag, but resource correction and source import require JSON knowledge.
- Experienced editor: direct edits help; repeated controls and no section outline slow long reviews.
- Keyboard/screen-reader reviewer: native controls and status regions help; selected navigation/steps lack programmatic state. Actual traversal untested.
- Professional-learning manager: optional checkmarks can look like formal completion evidence; transfer paths require a new mental model.

## Detector evidence and minor observations
13 markup findings across index/workflow: 8 warnings, 5 advisories. Four rendered scans at desktop and 390x844 produced 14 observations, not unique defects. Confirmed contrast plus h1-to-h3 heading skip (app.mjs:36). Single-word wraps and unbalanced mobile resource headings are minor polish. Repeated card shadows and dark glow are false positives from hidden dialog CSS. Common font and eyebrow rules are aesthetic preferences, not release blockers.

## Questions to consider
Should the assembled lesson primarily support reading/flagging, with authoring revealed only on demand? Should optional checkmarks be personal progress or formal evidence? Should undo restore the last edit, section or approved baseline?

## Recommended direction
Prioritize accessible, reversible correction; simplify review controls; clarify status; finish with impeccable polish. Follow-up choice: accessibility/recovery, review simplicity, or guided editing.

