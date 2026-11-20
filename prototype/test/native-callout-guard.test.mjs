import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDemo,demoAdapter} from '../dist/demo-transfer.mjs';
import {clone,canonical} from '../dist/transfer-core.mjs';
import {prepareTransfer} from '../dist/reusable-transfer.mjs';
const source=JSON.parse(readFileSync(new URL('../dist/fixture.json',import.meta.url)));
test('multi-callout edits block the complete native batch before any valid prefix mutates the editor',async()=>{
 const state=createDemo(source),extra={type:'discussionGoal',markdown:'Keep this independent callout.'};
 state.server.activities[0].activitySections[0].tips.push(clone(extra));state.editor.saved=clone(state.server);state.editor.protection.bootstrap=clone(state.server);
 state.editor.live.activities[0].activitySections[0].tips.push(clone(extra));state.editor.protection.unmanagedActivities[0].activitySections[0].tips.push(clone(extra));
 state.pkg.lesson.sections[0].callouts.push({type:'Discussion Goal',body:extra.markdown});state.pkg.lesson.sections[0].callouts[0].body='Reviewed change to the first callout.';
 state.pkg.lesson.frontMatter.preparation='An otherwise supported earlier change.';state.pkg.baseline=clone(state.pkg.lesson);
 const before=canonical(state.editor),adapter=demoAdapter(state,()=>{});let mutations=0;
 const io={...adapter,checkpoint:async()=>{},bridge:async request=>{if(!['read','lookup-levels'].includes(request.action))mutations++;return adapter.bridge(request);}};
 await assert.rejects(prepareTransfer(state.pkg,io),/multi-callout native editor targeting/);assert.equal(mutations,0);assert.equal(canonical(state.editor),before);assert.equal(state.sendCount,0);
});
