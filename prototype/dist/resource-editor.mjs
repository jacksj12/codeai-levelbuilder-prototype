const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function resourceDraft(resources,buffer){
 const rows=buffer==null?structuredClone(resources):JSON.parse(buffer);
 if(!Array.isArray(rows)||rows.some(r=>!r||typeof r!=='object'||Array.isArray(r)))throw Error('Resource edits must contain a list of resource records.');
 return rows;
}
export function updateResource(resources,buffer,index,field,value){
 if(!['name','type','audience','url'].includes(field))throw Error('Unknown resource field.');
 const rows=resourceDraft(resources,buffer);
 if(!rows[index])throw Error('Resource no longer exists.');
 rows[index][field]=value;
 return JSON.stringify(rows,null,2);
}
export function resourceEditor(resources,buffer){
 let rows;try{rows=resourceDraft(resources,buffer);}catch{
 return '<p role="alert">Saved resource edits cannot be shown as fields. Correct the saved data below, or discard pending edits to return to the applied resources.</p><label for="resource-json">Saved resource data</label><textarea id="resource-json" class="editor" rows="12">'+esc(buffer)+'</textarea>';
 }
 return '<p>Check each resource’s name, type, audience, and link. Answer keys must remain teacher-only. Changes stay pending until you apply them.</p>'+(!rows.length?'<p>No resources yet. Use Add content → Resource in a teaching section to add one.</p>':'')+rows.map((r,i)=>'<fieldset class="resource-fields"><legend>Resource '+(i+1)+'</legend>'+['name','type','audience','url'].map(field=>{
 const id='resource-'+i+'-'+field,label={name:'Resource name',type:'Resource type',audience:'Who can use this?',url:'Resource link (https://)'}[field];
 const attrs='id="'+id+'" data-resource-index="'+i+'" data-resource-field="'+field+'"';
 return '<label for="'+id+'">'+label+'</label>'+(field==='audience'?'<select class="editor" '+attrs+'>'+[...new Set([r.audience||'','Student','Teacher','Verified Teacher'])].map(value=>'<option value="'+esc(value)+'"'+(value===(r.audience||'')?' selected':'')+'>'+esc(value||'Choose an audience')+'</option>').join('')+'</select>':'<input class="editor" '+attrs+' type="'+(field==='url'?'url':'text')+'" value="'+esc(r[field])+'"'+(field==='type'?' list="resource-types"':'')+'>');
 }).join('')+'</fieldset>').join('')+'<datalist id="resource-types"><option value="Slides"><option value="Activity Guide"><option value="Answer Key"><option value="Video"><option value="Reference"></datalist>';
}
