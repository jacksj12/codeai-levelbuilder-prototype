import {SANDBOX} from './core.mjs';
export const ORIGIN='https://levelbuilder-studio.code.org';
export function validDestination(d){
 return Number.isSafeInteger(d?.id)&&d.id>0&&(d.url===ORIGIN+'/lessons/'+d.id+'/edit'||d.id===8898985&&d.url===SANDBOX);
}
export function selectDestination(url,practiceConfirmed){
 if(practiceConfirmed!==true)throw Error('Confirm that this is your editable practice lesson, not an official source.');
 const match=String(url).trim().match(/^https:\/\/levelbuilder-studio\.code\.org\/lessons\/([1-9]\d*)\/edit$/);
 const destination=match?{id:Number(match[1]),url:String(url).trim()}:null;
 if(!validDestination(destination))throw Error('Use the canonical editor URL: https://levelbuilder-studio.code.org/lessons/LESSON_ID/edit');
 return destination;
}
