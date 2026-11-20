import {clone} from './transfer-core.mjs';

const front={teacherOverview:'overview',studentOverview:'studentOverview',purpose:'purpose',preparation:'preparation',assessmentOpportunities:'assessmentOpportunities'};
// Existing fields only; collection creation and lesson renaming are separate.
export function savedFieldPath(op){
 const p=op.path;if(op.kind!=='set')return null;
 if(p.length===2&&p[0]==='frontMatter'&&Object.hasOwn(front,p[1]))return [front[p[1]]];
 if(p[0]!=='activities'||!Number.isInteger(p[1])||p[1]<0)return null;
 if(p.length===3&&['title','duration'].includes(p[2]))return ['activities',p[1],p[2]==='title'?'name':'duration'];
 if(p.length===7&&p[2]==='sections'&&Number.isInteger(p[3])&&p[3]>=0&&p[4]==='callouts'&&Number.isInteger(p[5])&&p[5]>=0&&['type','body'].includes(p[6]))return ['activities',p[1],'activitySections',p[3],'tips',p[5],p[6]==='body'?'markdown':'type'];
 if(p.length===5&&p[2]==='sections'&&Number.isInteger(p[3])&&p[3]>=0&&['title','body','duration','remarks'].includes(p[4]))return ['activities',p[1],'activitySections',p[3],({title:'name',body:'description'})[p[4]]||p[4]];
 return null;
}
export function fieldAt(root,path){return path.reduce((v,k)=>v?.[k],root);}
export function putField(root,path,value){const parent=fieldAt(root,path.slice(0,-1));if(!parent||!Object.hasOwn(parent,path.at(-1)))throw Error('A reviewed native field is missing.');parent[path.at(-1)]=clone(value);}
export function liveFieldPath(op){const saved=savedFieldPath(op);return saved?.length===1?['fields',op.path[1]]:saved;}

const calloutTypes={'Teaching Tip':'teachingTip','Content Corner':'contentCorner','Discussion Goal':'discussionGoal','Assessment Opportunity':'assessmentOpportunity','Ethics Opportunity':'ethicsOpportunity'};
export function nativeFieldValue(op){return op.path.length===7&&op.path[6]==='type'?calloutTypes[op.after]:op.after;}
export function protectedFieldPath(path){return path?.length===7&&path[4]==='tips'?['unmanagedActivities',...path.slice(1)]:null;}
export function restoreFieldProtection(target,original,path){const p=protectedFieldPath(path);if(p)putField(target,p,fieldAt(original,p));}
