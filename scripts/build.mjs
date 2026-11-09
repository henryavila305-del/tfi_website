import { execFileSync } from 'node:child_process';
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { renderPublicPicks } from './render-public-picks.mjs';
// The hold is enforced before any output is written; no command-line bypass.
execFileSync(process.execPath, ['scripts/check-public-picks.mjs'], { stdio: 'inherit' });
const template = await readFile('index.html', 'utf8');
const picks = JSON.parse(await readFile('content/public-picks.json', 'utf8'));
const html = renderPublicPicks(template, picks);
await mkdir('dist', { recursive: true });
for (const file of ['styles.css', 'app.js', 'favicon.svg', 'records.js']) await copyFile(file, 'dist/' + file);
await writeFile('dist/index.html', html);
console.log('Built static site in dist/');
