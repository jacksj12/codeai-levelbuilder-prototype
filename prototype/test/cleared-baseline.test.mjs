import test from 'node:test';
import assert from 'node:assert/strict';
import {assertCleanSavedBaseline} from '../dist/reusable-transfer.mjs';
import {clone,canonical} from '../dist/transfer-core.mjs';

// Mirrors Code.org mapActivityDataForEditor defaults without retaining private
// destination content or identities. Persisted nulls are left untouched.
function cleared(){
 const saved={id:9000001,name:'Cleared practice lesson',overview:null,studentOverview:null,purpose:null,preparation:'Keep this preparation.',assessmentOpportunities:null,lockable:false,hasLessonPlan:true,assessment:null,unplugged:null,background:null,creativeCommonsLicense:null,resources:[],objectives:[],vocabularies:[],activities:[{id:10,position:1,name:null,duration:null,activitySections:[{id:20,position:1,name:null,duration:null,description:null,remarks:null,tips:null,progressionName:null,scriptLevels:[]}]}]};
 const activities=clone(saved.activities);
 for(const a of activities){a.key=String(a.id);a.name=a.name||'';a.duration=a.duration||'';for(const s of a.activitySections){s.key=String(s.id);s.name=s.name||'';s.description=s.description||'';s.duration=s.duration||'';s.progressionName=s.progressionName||'';s.tips=s.tips||[];}}
 const editor={kind:'native-dom-capture',readerVersion:'native-scalars-v1',destination:{id:9000001,url:'https://levelbuilder-studio.code.org/lessons/9000001/edit'},saved:clone(saved),blockers:[],live:{fields:{title:saved.name,teacherOverview:'',studentOverview:'',purpose:'',preparation:saved.preparation,assessmentOpportunities:''},activities,objectives:[],resources:[],vocabularies:[]},protection:{controls:[{label:'Lockable',type:'checkbox',value:false},{label:'Has Lesson Plan',type:'checkbox',value:true},{label:'Assessment',type:'checkbox',value:false},{label:'Unplugged Lesson',type:'checkbox',value:false},{label:'Background',type:'select-one',value:''},{label:'Creative Commons Image',type:'select-one',value:'Creative Commons BY-NC-SA'}]}};
 return {saved,editor};
}

test('fresh cleared lesson nulls match documented native empty defaults without mutating either capture',()=>{
 const {saved,editor}=cleared(),before=canonical({saved,editor});assert.doesNotThrow(()=>assertCleanSavedBaseline(editor,saved));assert.equal(canonical({saved,editor}),before);
});

test('cleared baseline retains real edits and reports their exact semantic location',()=>{
 for(const [change,path]of [[e=>e.live.fields.teacherOverview='Outside work','frontMatter / teacherOverview'],[e=>e.live.activities[0].name='Outside activity','activities / 0 / title'],[e=>e.live.activities[0].activitySections[0].description='Outside guidance','activities / 0 / sections / 0 / body'],[e=>e.live.activities[0].activitySections[0].tips.push({type:'teachingTip',markdown:'Outside callout'}),'activities / 0 / sections / 0 / callouts / 0']]){
  const {saved,editor}=cleared();change(editor);const before=canonical(editor);assert.throws(()=>assertCleanSavedBaseline(editor,saved),error=>error.message.includes(path));assert.equal(canonical(editor),before);
 }
});

test('cleared baseline never turns explicit zero timing or a changed setting into a clean match',()=>{
 for(const change of [e=>e.live.activities[0].duration=0,e=>e.live.activities[0].activitySections[0].duration='0',e=>e.protection.controls[0].value=true]){const {saved,editor}=cleared();change(editor);assert.throws(()=>assertCleanSavedBaseline(editor,saved),/unsaved/);}
});
