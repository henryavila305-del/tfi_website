import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { renderPage } from './public-picks.mjs';
await mkdir('dist', { recursive: true });
for (const file of ['styles.css', 'app.js', 'favicon.svg', 'records.js']) await copyFile(file, `dist/${file}`);
await writeFile('dist/index.html',renderPage(await readFile('index.html','utf8'),JSON.parse(await readFile('content/public-picks.json','utf8'))));
console.log('Built static site in dist/');

