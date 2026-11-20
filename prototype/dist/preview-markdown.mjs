const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeLink=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
const format=text=>esc(text)
 .replace(/&lt;i class=&quot;([^&]+)&quot; aria-hidden=&quot;true&quot;&gt;&lt;\/i&gt;/g,(_,cls)=>`<span class="icon-preview" title="${cls}">${cls.includes('fa-rectangle-list')?'[Slide]':'[icon]'}</span>`)
 .replace(/`([^`\n]+)`/g,'<code>$1</code>')
 .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
 .replace(/\*([^*\n]+)\*/g,'<em>$1</em>');
export function renderMarkdown(text,resources=[]){
 const input=String(text??'');
 const tokens=/!\[(?<alt>[^\]\n]*)\]\((?<image>https:\/\/[^\s)]+|data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+)\)|\[(?<code>`[^`\n]+`(?:\(#[a-fA-F\d]{6}\))?)\]\((?<doc>https:\/\/[^\s)]+)\)|\[(?<label>[^\]\n]+)\]\((?<link>https:\/\/[^\s)]+)\)|\[r (?<resource>[-\w]+)\]/g;
 let output='',index=0;
 for(const match of input.matchAll(tokens)){
  output+=format(input.slice(index,match.index));index=match.index+match[0].length;
  const g=match.groups;
  if(g.image){
   const url=g.image.startsWith('data:image/')?g.image:safeLink(g.image);
   output+=url?`<img class="lesson-image" src="${esc(url)}" alt="${esc(g.alt)}" loading="lazy" referrerpolicy="no-referrer">`:format(match[0]);
  }else if(g.doc||g.link){
   const url=safeLink(g.doc||g.link);
   const code=g.code?.match(/^`([^`]+)`(?:\((#[a-fA-F\d]{6})\))?$/);
   const label=code?`<span${code[2]?` style="color:${code[2]}"`:''}><code>${esc(code[1])}</code></span>`:format(g.label);
   output+=url?`<a href="${esc(url)}" target="_blank" rel="noopener">${label}</a>`:format(match[0]);
  }else{
   const resource=resources.find(r=>r.key===g.resource),url=resource&&safeLink(resource.url);
   output+=url?`<a class="resource-reference" href="${esc(url)}" target="_blank" rel="noopener">${esc(resource.name)} — ${esc(resource.type)}</a>`:`${format(match[0])} <span class="muted">(resource reference needs a matching record)</span>`;
  }
 }
 return output+format(input.slice(index));
}
