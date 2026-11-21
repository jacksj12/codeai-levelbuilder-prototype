import {clone,canonical,digest} from './transfer-core.mjs';
export const isObjectiveAppend=op=>op.kind==='append'&&op.path.length===2&&op.path[0]==='frontMatter'&&op.path[1]==='objectives';
export function objectivePayload(record){
 if(!record||record.id!=null||typeof record.key!=='string'||!/^objective-\d+$/.test(record.key)||typeof record.description!=='string'||!record.description.trim()||record.description.length>100000||canonical(record.scriptLevelIds)!=='[]'||Object.keys(record).some(k=>!['id','key','description','scriptLevelIds'].includes(k)))throw Error('A new objective contains unreviewed identity, tags or metadata.');
 return {description:record.description,scriptLevelIds:[]};
}
const strip=capture=>{const copy=clone(capture);copy.live.objectives.pop();copy.protection.objectives.pop();return copy;};
export async function recoverObjectiveAdditions(bridge,previous){
 const count=previous.initialCapture.live.objectives.length,operations=previous.plan.operations.filter(isObjectiveAppend),reduced=clone(previous);
 reduced.plan.operations=reduced.plan.operations.filter(op=>!isObjectiveAppend(op));
 const trim=c=>{let copy=clone(c);while(copy.live.objectives.length>count)copy=strip(copy);return copy;};
 if(reduced.stagedCapture)reduced.stagedCapture=trim(reduced.stagedCapture);reduced.reports=(reduced.reports||[]).map(r=>r.journal?{...r,journal:{...r.journal,capture:trim(r.journal.capture)}}:r);
 let current=await bridge({action:'read'});if(current.live.objectives.length===count)return reduced;
 const known=[];for(const point of [previous.initialCapture,previous.stagedCapture,...(previous.reports||[]).map(r=>r.journal?.capture)].filter(Boolean)){let copy=clone(point);known.push(canonical(copy));while(copy.live.objectives.length>count){copy=strip(copy);known.push(canonical(copy));}}
 if(!known.includes(canonical(current)))throw Error('Outside edits or missing objective checkpoints prevent recovery.');
 while(current.live.objectives.length>count){const index=current.live.objectives.length-1,record=current.live.objectives[index],op=operations.find(o=>o.before.length===index);if(!op||objectivePayload(record).description!==op.after)throw Error('The unsaved objective is not owned by this review.');const expected=strip(current);current=await bridge({action:'remove-created-objective',mode:'unsaved-structure-staging',operation:{path:['frontMatter','objectives',index],index,expected:clone(record)},expectedCaptureDigest:await digest(current)});if(canonical(current)!==canonical(expected))throw Error('Objective recovery changed unrelated content.');}
 return reduced;
}
