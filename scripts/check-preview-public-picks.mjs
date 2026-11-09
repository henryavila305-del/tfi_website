import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const read = name => readFile(name,'utf8');
const source = await read('index.html');
const content = await read('content/public-picks.json');
execFileSync(process.execPath,['scripts/preview-public-picks.mjs'],{stdio:'inherit'});
const directory = 'work/pick-preview/';
const full = await read(directory+'full.html'), fallback = await read(directory+'full-no-script.html');
for (const html of [full,fallback]) {
  assert.match(html,/SYNTHETIC REVIEW ONLY/);
  assert.match(html,/PUBLIC PICKS · 6/);
  assert(!html.includes('AWAITING PUBLICATION'));
  assert.equal((html.match(/class="public-pick"/g)||[]).length,6);
  assert(html.includes('<dd>withdrawn</dd>'));
  assert(html.includes('Synthetic withdrawal only'));
  assert(html.includes('2026-11-01T12:30:00.000Z'));
  assert(html.includes('Win percentage: 50.0%'));
  assert(!html.includes('synthetic-withdrawal-reference'));
  assert(!html.includes('synthetic-only'),'Approval metadata must not render');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,'Full page must have unique IDs');
  for (const [,refs] of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g))
    for(const id of refs.split(/\s+/)) assert(ids.includes(id),'Missing accessible target '+id);
  for (const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(id),'Broken full-page anchor '+id);
  for (const [,asset] of html.matchAll(/(?:href|src)="\.\/([^"]+)"/g)) await access(directory+asset);
  const historical = text => text.slice(text.indexOf('<section id="results"'),text.indexOf('<section id="sports"'));
  assert.equal(historical(html),historical(source),'Synthetic cards must not change historical records');
}
assert.equal((full.match(/<script\b/g)||[]).length,2);
assert(!/<script\b/.test(fallback),'Fallback must not depend on scripts');
assert.equal(await read('index.html'),source,'Preview must not edit website source');
assert.equal(await read('content/public-picks.json'),content,'Preview must not edit publication content');
assert.deepEqual(JSON.parse(content),[]);
console.log('Passed full-page fixture anchors/assets/ARIA, historical isolation, script-free fallback, and unchanged publication content.');
