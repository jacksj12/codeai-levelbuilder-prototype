import {readFile} from 'node:fs/promises';
import {verifySavedReadback,validateSaveReview} from '../dist/save-review.mjs';
import {saveDiagnostics} from '../dist/save-diagnostics.mjs';

// Offline only: does not import an adapter, access credentials, or send requests.
async function audit(file){
 const report=JSON.parse(await readFile(file,'utf8')),receipt=report.receipt||report;
 if(receipt.kind!=='approved-native-save-receipt'||!receipt.review)throw Error('Choose a retained transfer receipt or run report.');
 await validateSaveReview(receipt.review,{checkExpiry:false});
 const verification=receipt.readback?await verifySavedReadback(receipt.review,receipt.readback):null;
 const evidence={...receipt,verification},diagnostics=saveDiagnostics(evidence);
 return {destinationId:receipt.review.destination.id,attempted:receipt.attempted===true,httpStatus:receipt.dispatch?.httpStatus??null,
  verification,diagnostics,remoteRequests:0,originalEvidenceModified:false};
}
if(process.argv.length<3){console.error('Usage: node scripts/audit-transfer.mjs <report.json> [more reports]');process.exitCode=2;}
for(const file of process.argv.slice(2)){
 try{console.log(JSON.stringify(await audit(file),null,2));}catch{console.error('Report could not be verified. Preserve the original; check its format and review integrity.');process.exitCode=1;}
}
