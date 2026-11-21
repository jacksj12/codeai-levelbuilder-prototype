// Read-only evidence interpretation. Never grants approval or authorizes a retry.
export function saveDiagnostics(receipt){
 const messages=[],dispatch=receipt?.dispatch,verification=receipt?.verification;
 if(!receipt?.attempted)return {code:'not-attempted',messages:['No save was attempted.'],retryAllowed:false};
 const summary=dispatch?.responseSummary;
 const native=dispatch?.transport==='native-editor';
 if(native)messages.push('The reviewed native Save and Keep Editing control was invoked once. Independent saved readback determines the result.');
 if(Number.isInteger(dispatch?.httpStatus))messages.push('Server response: HTTP '+dispatch.httpStatus+'. This alone does not confirm a saved lesson.');
 if(summary?.kind==='lesson-summary'){
  messages.push('Save response: lesson '+summary.lessonId+', '+summary.levelAssociations+' level association(s).');
  if(summary.lessonId!==receipt.review?.destination.id)messages.push('The save response identifies a different lesson. Preserve this report for investigation.');
  if(summary.truncated)messages.push('The response identity list was truncated; counts describe the full response.');
 }else if(!native)messages.push(summary?'The response did not contain a readable lesson summary.':'This attempt did not retain a save-response summary. It cannot be reconstructed from a later readback.');
 let code='unconfirmed';
 if(receipt.review?.preservationTest){code=verification?.passed&&receipt.nativeAcknowledgementConfirmed?'verified':'unconfirmed';messages.push(verification?.passed?'Independent readback confirms the entire lesson is unchanged.':'Independent readback has not confirmed complete preservation.');messages.push(receipt.nativeAcknowledgementConfirmed?'The native editor acknowledged this save.':'Native save acknowledgement is missing. Unchanged data alone cannot prove the save-dispatch test passed.');}
 else if(verification?.passed){code='verified';messages.push('An independent saved read confirms the reviewed changes.');}
 else if(verification?.baselineUnchanged){code='unchanged';messages.push('Independent readback matches the pre-save baseline. The proposed changes are not present.');}
 else messages.push('Independent readback has not verified the complete reviewed result.');
 if(receipt.readbackError)messages.push('The latest independent saved read failed. Preserve the run report.');
 if(!verification?.passed)messages.push('Keep this run and its restore point. Recheck reads saved data only; it does not resend. The cause is not established by these results.');
 return {code,messages,retryAllowed:false};
}
