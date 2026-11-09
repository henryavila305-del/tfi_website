import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' });
const expected = ['app.js', 'favicon.svg', 'index.html', 'styles.css','tracker/domain.mjs','tracker/index.html','tracker/ui.css','tracker/ui.mjs'];
async function files(dir, prefix = '') { const result = []; for (const entry of await readdir(dir, { withFileTypes:true })) { const path = `${prefix}${entry.name}`; if (entry.isDirectory()) result.push(...await files(`${dir}/${entry.name}`, `${path}/`)); else result.push(path); } return result.sort(); }
assert.deepEqual(await files('dist'), expected, 'Output must contain only the public static assets; no accounts, server, audit or database files');
for (const asset of expected) {
  assert.deepEqual(await readFile(`dist/${asset}`), await readFile(asset), `Built ${asset} must match the reviewed source`);
}
// Check a second build too: repeated builds must preserve the same public output.
execFileSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' });
for (const asset of expected) {
  assert.deepEqual(await readFile(`dist/${asset}`), await readFile(asset), `Repeated build changed ${asset}`);
}
console.log('Passed: exact public output allowlist, byte-for-byte source match, and repeatable build.');

