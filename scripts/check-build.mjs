import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' });
const expected = ['app.js', 'favicon.svg', 'index.html', 'access-8e74c2a9f610.html', 'records.js', 'review.html', 'tfi-banner.webp', 'tfi-logo.webp', 'cashed-spotlight.webp', 'post-admin.html', 'post-admin.mjs', 'spotlight-core.mjs', 'spotlight-config.mjs', 'spotlight-public.mjs', 'top-three-core.mjs', 'top-three-public.mjs', 'live-score-core.mjs', 'live-scores.mjs', 'styles.css'];
assert.deepEqual((await readdir('dist')).sort(), [...expected].sort(), 'Output must contain only the public static assets');
for (const asset of expected) {
  assert.deepEqual(await readFile(`dist/${asset}`), await readFile(asset), `Built ${asset} must match the reviewed source`);
}
// Check a second build too: repeated builds must preserve the same public output.
execFileSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' });
for (const asset of expected) {
  assert.deepEqual(await readFile(`dist/${asset}`), await readFile(asset), `Repeated build changed ${asset}`);
}
console.log('Passed: exact public output allowlist, byte-for-byte source match, and repeatable build.');


