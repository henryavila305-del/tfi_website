import { execFileSync } from 'node:child_process';
import { mkdir, copyFile, readFile, writeFile, lstat, readdir } from 'node:fs/promises';
import { renderPublicPicks } from './render-public-picks.mjs';
// The hold is enforced before any output is written; no command-line bypass.
execFileSync(process.execPath, ['scripts/check-public-picks.mjs'], { stdio: 'inherit' });
const template = await readFile('index.html', 'utf8');
const picks = JSON.parse(await readFile('content/public-picks.json', 'utf8'));
const html = renderPublicPicks(template, picks);
// Refuse stale or non-file output instead of leaving unreviewed files in a build.
const allowed = new Set(['index.html','styles.css','app.js','favicon.svg','records.js']);
const output = await lstat('dist').catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
});
if (output) {
  if (!output.isDirectory() || output.isSymbolicLink()) throw new Error('Build output must be a regular directory');
  for (const entry of await readdir('dist', { withFileTypes: true })) {
    if (!allowed.has(entry.name) || !entry.isFile()) throw new Error('Unexpected build output: ' + entry.name);
  }
}
await mkdir('dist', { recursive: true });
for (const file of ['styles.css', 'app.js', 'favicon.svg', 'records.js']) await copyFile(file, 'dist/' + file);
await writeFile('dist/index.html', html);
console.log('Built static site in dist/');
