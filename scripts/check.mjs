import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const html = await readFile('index.html', 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(target), `Missing anchor ${target}`);
for (const [, asset] of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)) await readFile(asset);
assert.match(html, /<html lang="en">/);
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.equal((html.match(/<dt>/g) || []).length, 3, 'Each result metric has one term');
assert.equal((html.match(/<dd>/g) || []).length, 3, 'Each result metric has one description');
assert(!/<dt class="note">/.test(html), 'Metric status belongs in the description');
assert.match(html, /<main id="main" tabindex="-1">/, 'Skip destination can receive focus');
for (const id of ['picks', 'results', 'sports', 'premium', 'about']) {
  assert(html.includes(`<section id="${id}" tabindex="-1"`), `${id} can receive menu focus`);
}
assert.match(html, /id="sport-detail" role="region" aria-labelledby="sport-title"/);
assert.match(html, /No free picks published yet/);
assert.match(html, /These are empty fields, not sample results/);
assert.match(html, /<button[^>]*disabled>Whop link coming soon/);
assert(!/https?:\/\//.test(html), 'No unverified external destinations');
assert(!/supabase|api[_-]?key|service_role|password/i.test(html), 'No private integration configuration');
execFileSync(process.execPath, ['--check', 'app.js']);
console.log(`Passed: ${ids.length} unique anchors, local assets, honest content states, no external integration, JavaScript syntax.`);
