import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'access-568880a4f046d5fd5f0f2837ffde23da.html', 'access-5226f3fe0c4c4b92b6ce20a086e1d1c0.html', 'access-e06f5e9440bdd33f22a84e547220baf2.html', 'access-77b76798306a3fac4b86b7d533aaf6f2.html', 'access-97d41cf0549c4446a05ac46b7e677e8a.html', 'access-c6ce95ee92f44517a4d13ab3fc4096dd.html', 'access-07b6e8aa04e74cd2a1f026a81952d793.html', 'access-824c756d4f18497fa9e684aedf6b3216.html', 'access-f50673fcfda37483.html', 'access-51fdb64a0070420bbf00b4cf90cbcaff.html', 'styles.css', 'app.js', 'favicon.svg', 'records.js', 'review.html', 'tfi-banner.webp', 'tfi-logo.webp', 'cashed-spotlight.webp', 'post-admin.html', 'post-admin.mjs', 'spotlight-core.mjs', 'spotlight-config.mjs', 'spotlight-public.mjs', 'top-three-core.mjs', 'top-three-public.mjs', 'live-score-core.mjs', 'live-scores.mjs', 'scores.html', 'scoreboard.mjs']) await copyFile(file, `dist/${file}`);
console.log('Built static site in dist/');


