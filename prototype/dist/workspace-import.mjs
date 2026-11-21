import {canonical,clone} from './transfer-core.mjs';
// Commit only against the exact workspace snapshot that the import began with.
export async function prepareWorkspaceImport(getState,file,operation){
 if(file.size>32_000_000)throw Error('Choose a report smaller than 32 MB.');
 const initial=clone(getState()),stamp=canonical(initial),report=JSON.parse(await file.text());
 const result=await operation(initial,report);
 if(canonical(getState())!==stamp)throw Error('The workspace changed while this report was loading. Your edits are preserved. Import the report again to compare against them.');
 return result;
}
