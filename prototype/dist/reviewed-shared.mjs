import {clone,canonical,digest} from './transfer-core.mjs';
import {validateSharedRecord} from './shared-records.mjs';
export const sharedKind=op=>op.kind==='append'&&op.path.length===1&&op.path[0]==='resources'?'resources':op.kind==='append'&&op.path.length===2&&op.path[0]==='frontMatter'&&op.path[1]==='vocabulary'?'vocabularies':null;
export const resourceRow=r=>({key:r.key,name:r.name,type:r.type,audience:r.audience,url:r.url});
export const vocabularyRow=r=>({word:r.word,definition:r.definition});
export function sharedAppendValid(op){const kind=sharedKind(op);if(!kind||!Array.isArray(op.before))return false;try{validateSharedRecord(kind,op.record);return kind==='resources'?op.record.isRollup===false&&canonical(op.after)===canonical({...resourceRow(op.record),destinationRecordId:null}):op.after===op.record.word+': '+op.record.definition;}catch{return false;}}
export async function recoverSharedRehearsal(bridge,previous){
 const current=await bridge({action:'read'}),initial=previous.initialCapture;if(canonical(current)===canonical(initial))return {status:'restored',restored:true,saved:false,finalCapture:current};
 const known=[previous.stagedCapture,...(previous.reports||[]).map(r=>r.journal?.capture)].filter(Boolean);if(!known.some(c=>canonical(c)===canonical(current)))throw Error('Outside edits or missing shared-association checkpoints prevent restoration.');
 const restored=await bridge({action:'reload-reviewed-editor',mode:'restore-reviewed-rehearsal',initialCapture:clone(initial),expectedCaptureDigest:await digest(current)});if(canonical(restored)!==canonical(initial))throw Error('Shared-association rehearsal did not restore its complete original capture.');return {status:'restored',restored:true,saved:false,finalCapture:restored};
}
