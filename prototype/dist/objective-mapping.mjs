// An explicit one-to-one mapping changes descriptions, never native identities or tags.
export function objectiveReplacements(mapping, destination, records, descriptions){
 if(mapping?.schemaVersion!==1||mapping.destinationId!==destination.id||!Array.isArray(mapping.baseline)||!Array.isArray(mapping.targets)||!Array.isArray(records))throw Error('Objective mapping is incomplete. Check the saved destination again.');
 const stable=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
 if(stable(mapping.baseline)!==stable(records))throw Error('Saved objectives or their level tags changed. Review their mappings again.');
 if(records.length!==descriptions.length||mapping.targets.length!==records.length||new Set(records.map(o=>o.id)).size!==records.length||records.some(o=>!Number.isSafeInteger(o.id)||o.id<1))throw Error('Objective mapping requires every existing record exactly once. Additions and removals need a separate review.');
 const ids=new Set(),indices=new Set();
 for(const target of mapping.targets){if(!target||ids.has(target.destinationId)||indices.has(target.sourceIndex)||!records.some(o=>o.id===target.destinationId)||!Number.isInteger(target.sourceIndex)||target.sourceIndex<0||target.sourceIndex>=descriptions.length||!descriptions[target.sourceIndex]?.trim())throw Error('Choose a different imported objective for every saved objective.');ids.add(target.destinationId);indices.add(target.sourceIndex);}
 return records.map((record,index)=>({index,description:descriptions[mapping.targets.find(t=>t.destinationId===record.id).sourceIndex]}));
}
