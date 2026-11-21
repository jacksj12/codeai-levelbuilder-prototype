// Compact repeated snapshots without dropping recovery evidence. Plain JSON records
// from earlier versions remain readable; exports continue to use ordinary JSON.
const PREFIX='lesson-evidence-v1:';
export function encodeTransferRecord(value){
 const plain=JSON.parse(JSON.stringify(value)),nodes=[],seen=new Map();
 function encode(v){
  if(v===null||typeof v!=='object'&&(typeof v!=='string'||v.length<80))return {v};
  const signature=JSON.stringify(v);if(seen.has(signature))return {r:seen.get(signature)};
  const node=Array.isArray(v)?{a:v.map(encode)}:typeof v==='string'?{s:v}:{o:Object.entries(v).map(([k,x])=>[k,encode(x)])};
  const id=nodes.length;nodes.push(node);seen.set(signature,id);return {r:id};
 }
 const root=encode(plain);return PREFIX+JSON.stringify({nodes,root});
}
export function decodeTransferRecord(raw){
 if(!raw.startsWith(PREFIX))return JSON.parse(raw);
 const {nodes,root}=JSON.parse(raw.slice(PREFIX.length));if(!Array.isArray(nodes)||nodes.length>200000)throw Error('Invalid evidence encoding.');
 let expanded=0;
 function decode(token,limit=nodes.length,depth=0){
  if(++expanded>1000000||depth>100||!token||typeof token!=='object')throw Error('Invalid evidence structure.');
  if(Object.hasOwn(token,'v')){if(token.v!==null&&typeof token.v==='object')throw Error('Invalid primitive.');return token.v;}
  if(!Number.isInteger(token.r)||token.r<0||token.r>=limit)throw Error('Invalid evidence reference.');
  const n=nodes[token.r];if(typeof n.s==='string')return n.s;
  if(Array.isArray(n.a))return n.a.map(x=>decode(x,token.r,depth+1));
  if(Array.isArray(n.o))return Object.fromEntries(n.o.map(([k,x])=>{if(typeof k!=='string')throw Error('Invalid key.');return [k,decode(x,token.r,depth+1)];}));
  throw Error('Invalid evidence node.');
 }
 return decode(root);
}
export function readTransferRecord(storage,key){
 let raw;try{raw=storage.getItem(key);}catch{throw Error('Browser storage is unavailable. Transfer is paused. Restore storage access and reload this same run; do not clear browser data.');}
 if(raw===null)return null;
 try{const value=decodeTransferRecord(raw);if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}catch{throw Error('Saved transfer evidence could not be read. It has been left untouched. Keep this run open and retain the original browser data before attempting recovery.');}
}
export function compactLegacyEvidence(storage){
 let reclaimed=0;const keys=[];
 if(!Number.isInteger(storage.length)||typeof storage.key!=='function')return 0;
 for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key==='native-scalar-staging-v1'||/^native-verification-latest(?:-\d+)?$/.test(key)||key?.startsWith('native-approved-save-')||key?.startsWith('reviewed-transfer-session-'))keys.push(key);}
 for(const key of keys){const raw=storage.getItem(key);if(!raw||raw.startsWith(PREFIX))continue;
  let encoded;try{const value=JSON.parse(raw);if(!value||typeof value!=='object')continue;encoded=encodeTransferRecord(value);if(JSON.stringify(decodeTransferRecord(encoded))!==JSON.stringify(value))continue;}catch{continue;}
  if(encoded.length>=raw.length)continue;
  // Replace atomically only after an exact round trip; never delete a report or receipt.
  storage.setItem(key,encoded);reclaimed+=raw.length-encoded.length;
 }return reclaimed;
}
export function writeTransferRecord(storage,key,value){
 const message='Transfer evidence could not be saved. Transfer is paused. Free storage space or restore access, then reload this same run. Do not clear browser data or start another save.';
 try{const encoded=encodeTransferRecord(value);try{storage.setItem(key,encoded);}catch(error){if(!compactLegacyEvidence(storage))throw error;storage.setItem(key,encoded);}}catch{throw Error(message);}
}
