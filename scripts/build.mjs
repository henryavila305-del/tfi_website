import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'favicon.svg', 'records.js', 'review.html', 'tfi-banner.webp', 'tfi-logo.webp']) await copyFile(file, `dist/${file}`);
console.log('Built static site in dist/');


