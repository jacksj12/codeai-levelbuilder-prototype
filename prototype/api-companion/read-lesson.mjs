// Self-contained because Chrome serializes this function into the selected tab.
export async function readAssignedLesson(request={}){
 try{
 if(typeof request==='string')request=JSON.parse(request);
 const origin='https://levelbuilder-studio.code.org';
 const allowed=['/courses/6-12-dev-playground/units/16/lessons/11','/courses/6-12-dev-playground/units/16/lessons/11/edit','/s/scottsdale-levelbuilder-exploration/lessons/11','/s/scottsdale-levelbuilder-exploration/lessons/11/edit','/lessons/8898985/edit'];
 if(location.origin!==origin||!allowed.includes(location.pathname.replace(/\/$/,'')))throw Error('Open the assigned Julian Playground lesson first.');
 const response=await fetch('/lessons/8898985/edit',{method:'GET',credentials:'same-origin',redirect:'error',cache:'no-store'});
 if(!response.ok)throw Error('Could not read the lesson. Check your Level Builder sign-in and permissions.');
 const doc=new DOMParser().parseFromString(await response.text(),'text/html');
 const bootstrap=doc.querySelector('script[data-lesson]');
 if(!bootstrap)throw Error('Lesson editor data was not found. The deployed editor may have changed.');
 const originalLessonJson=bootstrap.getAttribute('data-lesson'),lesson=JSON.parse(originalLessonJson);
 if(lesson.id!==8898985)throw Error('The returned lesson does not match the assigned destination.');
 if(!Array.isArray(lesson.activities)||!Array.isArray(lesson.resources))throw Error('Unexpected lesson format.');
 return request.returnRaw===true?{lesson,originalLessonJson}:lesson;
 }catch(error){if(request.transportErrors===true)return {nativeBridgeError:String(error?.message||error)};throw error;}
}
