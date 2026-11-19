# Browser-fill acceptance test — proposed, not run

Input: the user's latest approved review package for **Lesson 16: AI Lab**. Use the approved package, including user edits, rather than regenerating from the fixture.

Destination: only **Julian Playground – ChatGPT**, the assigned practice lesson. No remote save is authorized by this test plan. The automation must stop before any action that persists a lesson, creates a shared resource, or otherwise writes remotely.

## Review checklist

1. **Correct destination:** refuse another lesson or an unexpected nonempty editor rather than overwrite it.
2. **Front matter:** title, teacher overview, student overview, preparation and other supplied fields match the approved package. Intentional blanks remain blank.
3. **Objectives:** all three objective texts appear exactly once. Alphabetical reordering is acceptable; missing, duplicated or changed text fails.
4. **Teaching Guide:** three activities and ten sections appear in the approved order and grouping, retaining their complete guidance.
5. **Timing:** activity durations total 45 minutes. Untimed sections display blank minutes. Explicit section durations remain unchanged.
6. **Callouts:** all four Teaching Tips and two Assessment Opportunities remain attached to their intended sections with complete text.
7. **Resources:** include the user-supplied slide deck, teacher answer key and student activity guide with the approved URLs, types and audiences. The slides must open the presentation rather than the answer key.
8. **Level associations:** verify intended destination level links for the two linked sections. Never reuse source lesson database IDs blindly. Missing mappings are reported as blockers, not silently skipped.
9. **Review and interruption:** provide a readable completion report listing each filled item and any unfinished item with its location. An interrupted run or second attempt must not duplicate activities, sections, callouts or resources.
10. **Save boundary:** leave the populated editor unsaved for human inspection. Do not click Save or create shared records. Report any step that cannot be staged without saving and request approval only for a concrete reviewed change.

## Pass condition

All content checks pass, every required item is accounted for, and no remote save has occurred. Unsupported fields or unresolved resource/level mappings mean **incomplete**, not passed. Human review of the populated editor is required before separately authorizing a save.

## Current result

**Subsequent authorized save succeeded.** The user explicitly approved saving the completed lesson. Save and Close returned to the assigned lesson page, which displayed Lesson 16: AI Lab, 45 minutes, three activities, ten section headings, all six callouts, all three resource links grouped under teacher/student audiences, and level 1 plus assessment levels 2–4. Objectives appeared alphabetically without text loss. The browser-fill-and-save path has now been exercised once through agent-operated UI actions. Repeat-run duplication prevention and interruption recovery remain untested; a packaged one-click fill feature is still not implemented. Earlier unsaved-state notes below describe the prior review checkpoint.

**First agent-driven browser fill staged successfully, November 19, 2026.** The approved downloaded package was entered through the visible Level Builder editor in the assigned lesson. This is an agent-operated browser test, not a shipped one-click browser-fill feature.

Verified in the unsaved editor: title Lesson 16: AI Lab; both overviews; preparation; three objectives; three activities with durations 5, 35 and 5; ten sections whose complete guidance text matched the supplied approved content; section minutes blank except 20, 10 and 5; four Teaching Tips and two Assessment Opportunities; named progressions; the four matching existing levels, with assessment flags on the final three.

Resource creation required a separate server write. The user explicitly approved that write during the run. Three new resource records were created and their rows verified: AI Lab / Slides / Verified Teacher with the supplied presentation URL; AI Lab Activity Guide / Answer Key / Verified Teacher with the teacher guide URL; AI Lab Activity Guide / Activity Guide / Student with the student guide URL. This was an authorized exception to the original no-remote-write test boundary, followed by separate explicit approval to save the lesson.

The saved lesson is available at https://levelbuilder-studio.code.org/courses/6-12-dev-playground/units/16/lessons/11 . The user inspected the result and said it looked accurate and was good to keep. Interruption recovery and second-run duplication prevention were not exercised. Therefore the full acceptance suite is **not yet passed**, although the first agent-operated fill and authorized save succeeded. The existing 15 engineering checks do not cover browser filling.
