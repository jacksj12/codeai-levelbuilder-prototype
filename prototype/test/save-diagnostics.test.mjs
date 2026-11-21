import test from 'node:test';
import assert from 'node:assert/strict';
import {saveDiagnostics} from '../dist/save-diagnostics.mjs';
test('HTTP success and unchanged readback explain missing persistence without claiming a cause or enabling retry',()=>{
 const receipt={attempted:true,review:{destination:{id:123}},dispatch:{httpStatus:200,responseSummary:{kind:'lesson-summary',lessonId:123,levelAssociations:0}},verification:{passed:false,baselineUnchanged:true}};
 const before=JSON.stringify(receipt),d=saveDiagnostics(receipt);assert.equal(d.code,'unchanged');assert.equal(d.retryAllowed,false);assert.match(d.messages.join(' '),/proposed changes are not present/);assert.equal(JSON.stringify(receipt),before);
});
test('legacy missing response, wrong identity and readback failure remain distinguishable',()=>{
 assert.match(saveDiagnostics({attempted:true}).messages.join(' '),/cannot be reconstructed/);
 assert.match(saveDiagnostics({attempted:true,review:{destination:{id:1}},dispatch:{responseSummary:{kind:'lesson-summary',lessonId:2,levelAssociations:4}},readbackError:'offline'}).messages.join(' '),/different lesson.*latest independent saved read failed/);
 assert.equal(saveDiagnostics({attempted:true,verification:{passed:true}}).code,'verified');
 assert.equal(saveDiagnostics(null).code,'not-attempted');
});

test('unchanged data without acknowledgement does not count as a verified preservation dispatch',()=>{
 const report={attempted:true,review:{preservationTest:true},verification:{passed:true,baselineUnchanged:true},nativeAcknowledgementConfirmed:false};
 assert.equal(saveDiagnostics(report).code,'unconfirmed');assert.ok(saveDiagnostics(report).messages.some(m=>m.includes('acknowledgement is missing')));report.nativeAcknowledgementConfirmed=true;assert.equal(saveDiagnostics(report).code,'verified');
});
