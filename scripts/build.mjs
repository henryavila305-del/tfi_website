import { execFileSync } from 'node:child_process';
execFileSync(process.execPath, ['scripts/check-public-picks.mjs'], { stdio: 'inherit' });
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'favicon.svg', 'records.js']) await copyFile(file, `dist/${file}`);
console.log('Built static site in dist/');

