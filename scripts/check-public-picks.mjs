
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validatePublicPicks, summarizePublicPicks } from './public-picks.mjs';
const picks = validatePublicPicks(JSON.parse(await readFile('content/public-picks.json', 'utf8')));
assert.equal(picks.length, 0, 'Public publication remains on hold; board must stay empty');
const sample = { id:'synthetic-test-only', sport:'NBA', selection:'Synthetic selection', market:'Synthetic market', odds:-110, publishedAt:'2026-11-01T12:00:00.000Z', eventAt:'2026-11-01T13:00:00.000Z', reasoning:'Synthetic validation fixture; never published.', result:'pending', publicApproved:true, approvalReference:'synthetic-test-only' };
assert.equal(validatePublicPicks([sample]).length, 1);
for (const patch of [
  {publicApproved:false}, {approvalReference:''}, {sport:'UNKNOWN'}, {odds:0}, {odds:Infinity},
  {publishedAt:'2026-02-30T12:00:00.000Z'}, {eventAt:sample.publishedAt},
  {selection:'<script>'}, {result:'unknown'}, {source_url:'private'}, {reasoning:''}
]) assert.throws(() => validatePublicPicks([{...sample,...patch}]));
for (const field of Object.keys(sample)) {
  const missing = {...sample}; delete missing[field]; assert.throws(() => validatePublicPicks([missing]));
}
assert.throws(() => validatePublicPicks([sample,sample]));
assert.throws(() => validatePublicPicks({}));
assert.throws(() => validatePublicPicks([null]));
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
assert.equal(config.git.deploymentEnabled, false, 'Automatic Vercel deployment stays disabled');
console.log('Passed public-pick contract, rejection cases, empty publication hold, and deployment hold.');

const withdrawn = {...sample, result:'withdrawn', withdrawnAt:'2026-11-01T12:30:00.000Z', withdrawalReason:'Synthetic reason & context', withdrawalApproved:true, withdrawalApprovalReference:'synthetic-withdrawal-approval'};
assert.equal(validatePublicPicks([withdrawn]).length, 1);
for (const field of ['withdrawnAt','withdrawalReason','withdrawalApproved','withdrawalApprovalReference']) {
  const missing = {...withdrawn}; delete missing[field]; assert.throws(() => validatePublicPicks([missing]));
}
for (const patch of [
  {withdrawalApproved:false}, {withdrawalApproved:'true'}, {withdrawalApprovalReference:''}, {withdrawalApprovalReference:'x'.repeat(2001)}, {withdrawalReason:'<script>'},
  {withdrawalReason:' '}, {withdrawalReason:'x'.repeat(2001)}, {withdrawalReason:'bad\u0001text'},
  {withdrawnAt:'2026-02-30T12:30:00.000Z'}, {withdrawnAt:'2026-11-01T12:30:00+00:00'},
  {withdrawnAt:'2026-11-01T11:59:59.000Z'}, {withdrawalApprovalReference:'<private>'},
  {result:'void'}, {result:'pending'}, {privateNotes:'not allowed'}
]) assert.throws(() => validatePublicPicks([{...withdrawn,...patch}]));
assert.deepEqual(summarizePublicPicks([]), {wins:0,losses:0,winPercentage:null});
assert.deepEqual(summarizePublicPicks([withdrawn]), {wins:0,losses:0,winPercentage:null});
const mixed = ['win','win','loss','pending','push','void'].map((result,i)=>({...sample,id:'synthetic-stat-'+i,result}));
assert.deepEqual(summarizePublicPicks([...mixed,withdrawn]), summarizePublicPicks(mixed));
assert.equal(summarizePublicPicks([...mixed,withdrawn]).winPercentage, 200 / 3);
assert.throws(() => summarizePublicPicks([{...withdrawn,withdrawalApproved:false}]));
console.log('Passed synthetic withdrawal approval, evidence, time ordering and win-percentage exclusion.');
