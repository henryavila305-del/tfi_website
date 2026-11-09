
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validatePublicPicks } from './public-picks.mjs';
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
