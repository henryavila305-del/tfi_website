import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const html = await readFile('index.html', 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(target), `Missing anchor ${target}`);
for (const [, asset] of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)) await readFile(asset);
assert.match(html, /<html lang="en">/);
for (const [, references] of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) {
  for (const target of references.split(/\s+/)) assert(ids.includes(target), `Missing accessible reference ${target}`);
}
assert.match(html, /<nav id="navigation" aria-label="Main navigation">/, 'Navigation is available without JavaScript');
assert.match(html, /<button class="menu"[^>]* hidden>/, 'Unenhanced page must not show a nonfunctional menu toggle');
assert.equal((html.match(/<details>/g) || []).length, 3, 'FAQs retain native disclosure controls');
assert.equal((html.match(/<summary>/g) || []).length, 7);
assert.equal((html.match(/data-sport="/g) || []).length, 6, 'Public sports hub retains six sports');
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.equal((html.match(/class="record-panel"/g) || []).length, 4, 'Four historical category panels');
assert.equal((html.match(/class="record-chart"/g) || []).length, 4, 'Four historical charts');
assert(!/<dt class="note">/.test(html), 'Metric status belongs in the description');
assert.match(html, /<main id="main" tabindex="-1">/, 'Skip destination can receive focus');
for (const id of ['picks', 'results', 'sports', 'premium', 'about']) {
  assert(html.includes(`<section id="${id}" tabindex="-1"`), `${id} can receive menu focus`);
}
assert.match(html, /id="sport-detail" role="region" aria-labelledby="sport-title"/);
assert.match(html, /NEXT CARD STARTS HERE/);
assert.match(html, /PUBLIC PICKS \/ HISTORICAL RESULTS/, 'Preview status must be visible in the hero');
assert.match(html, /historical selections, not current picks/, 'Completed hero card is clearly dated');
assert.equal((html.match(/class="ranked-pick /g)||[]).length,3,'Three historical ranked selections');

const whopUrls = [
  'https://whop.com/x-63cc/tfi-all-access/',
  'https://whop.com/x-63cc/tfi-premium/'
];
assert.match(
  html,
  /<a\b(?=[^>]*class="button")(?=[^>]*href="https:\/\/whop\.com\/x-63cc\/tfi-all-access\/")(?=[^>]*target="_blank")(?=[^>]*rel="noopener noreferrer")[^>]*>Join TFI All Access\s*[—-]\s*\$35\.99\/month\s*↗<\/a>/,
  'Official TFI All Access membership link must be enabled and secure'
);
assert.match(
  html,
  /<a\b[^>]*class="button"[^>]*href="https:\/\/whop\.com\/x-63cc\/tfi-premium\/"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>Join TFI Premium\s*[—–-]\s*\$9\.99\/month\s*[^<]*<\/a>/,
  'Official TFI Premium membership link must be enabled and secure'
);
const externalUrls = [...html.matchAll(/https:\/\/[^\s"'<>]+/g)].map(match => match[0]);
assert.deepEqual(externalUrls, whopUrls, 'Only the two approved Whop destinations are allowed');


assert(!/supabase|api[_-]?key|service_role|password/i.test(html), 'No private integration configuration');
const css = await readFile('styles.css', 'utf8');
const js = await readFile('app.js', 'utf8');
assert(!/@import|url\(\s*['"]?https?:/i.test(css), 'CSS must not load remote assets');
assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(|\.sendBeacon\s*\(/.test(js), 'Public preview must remain disconnected from data services');
assert(!/<(?:iframe|form)\b/i.test(html), 'No embedded services or collection forms in this preview');
execFileSync(process.execPath, ['--check', 'app.js']);
console.log(`Passed: ${ids.length} unique anchors, local assets, honest content states, no external integration, JavaScript syntax.`);


