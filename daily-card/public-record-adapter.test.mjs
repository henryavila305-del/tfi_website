import assert from 'node:assert/strict';
import {safePublicRecordSnapshot,renderVerifiedRecords} from './public-record-adapter.mjs';
const records={
 'Top 3':{wins:149,losses:108,pushes:0},
 'Premium / Max Bet':{wins:64,losses:32,pushes:0},
 'Dog of the Day':{wins:35,losses:23,pushes:0},
 'Play of the Day':{wins:24,losses:31,pushes:2}
};
assert.throws(()=>safePublicRecordSnapshot({records,audited:false,baselineReconciled:true,throughDate:"2026-11-09"}),/Unaudited/);
assert.throws(()=>safePublicRecordSnapshot({records,audited:true,baselineReconciled:false}),/Unaudited/);
const safe=safePublicRecordSnapshot({records,audited:true,baselineReconciled:true,throughDate:"2026-11-09"});
assert.equal(safe['Premium / Max Bet'].winRate,'66.67');
assert(!JSON.stringify(safe).includes('NCAAB Premium'));
assert(!JSON.stringify(safe).includes('selection'));
const total={textContent:'unchanged'},rate={textContent:'unchanged'};
const panel={getAttribute:()=> 'Premium / Max Bet',querySelector:selector=>selector==='[data-tfi-record-total]'?total:rate};
const root={querySelectorAll:()=>[panel]};
renderVerifiedRecords({records,audited:true,baselineReconciled:true,throughDate:"2026-11-09"},root);
assert.equal(total.textContent,'64–32');
assert.equal(rate.textContent,'66.67%');
assert.throws(()=>safePublicRecordSnapshot({records:{...records,'Premium / Max Bet':{wins:-1,losses:32,pushes:0}},audited:true,baselineReconciled:true,throughDate:"2026-11-09"}),/Invalid public aggregate/);
console.log('PASS: audited read-only public aggregate adapter, private category omission and historical fallback gate');
