import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'favicon.svg', 'records.js', 'review.html', 'tfi-banner.webp', 'tfi-logo.webp', 'cashed-spotlight.webp', 'post-admin.html', 'post-admin.mjs', 'spotlight-core.mjs', 'spotlight-config.mjs', 'spotlight-public.mjs', 'top-three-core.mjs', 'top-three-public.mjs', 'live-score-core.mjs', 'live-scores.mjs']) await copyFile(file, `dist/${file}`);
await mkdir('dist/daily-card', { recursive: true });
await copyFile('daily-card/public-record-adapter.mjs', 'dist/daily-card/public-record-adapter.mjs');
console.log('Built static site in dist/');


