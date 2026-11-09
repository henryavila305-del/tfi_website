import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'favicon.svg']) await copyFile(file, `dist/${file}`);
await mkdir('dist/tracker', { recursive: true });
for (const file of ['index.html','ui.css','ui.mjs','domain.mjs']) await copyFile(`tracker/${file}`, `dist/tracker/${file}`);
console.log('Built static site in dist/');

