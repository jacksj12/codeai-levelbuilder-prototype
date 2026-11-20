export function reviewWindow(review,now=Date.now()){
 if(!review)return {expired:false,text:''};
 const expiry=Number(review.expiresAt);const expired=!Number.isFinite(expiry)||now>expiry;
 return {expired,text:expired?'This review has expired. Prepare a fresh review before approving.':'Review expires in '+Math.max(1,Math.ceil((expiry-now)/60000))+' minute(s). The destination is checked again before saving.'};
}
