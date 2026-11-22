import http from 'node:http';
import scores from '../api/scores.js';
import { readFile } from 'node:fs/promises';
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.mjs':'text/javascript', '.webp':'image/webp' };
const files = { '/scores.html': 'scores.html', '/scoreboard.mjs': 'scoreboard.mjs', '/live-score-core.mjs': 'live-score-core.mjs', '/live-scores.mjs': 'live-scores.mjs', '/top-three-core.mjs': 'top-three-core.mjs', '/top-three-public.mjs': 'top-three-public.mjs', '/': 'index.html', '/index.html': 'index.html', '/styles.css': 'styles.css', '/app.js': 'app.js', '/favicon.svg': 'favicon.svg', '/records.js': 'records.js', '/post-admin.html':'post-admin.html', '/post-admin.mjs':'post-admin.mjs', '/spotlight-core.mjs':'spotlight-core.mjs', '/spotlight-public.mjs':'spotlight-public.mjs', '/spotlight-config.mjs':'spotlight-config.mjs', '/tfi-banner.webp':'tfi-banner.webp', '/tfi-logo.webp':'tfi-logo.webp', '/cashed-spotlight.webp':'cashed-spotlight.webp', '/review.html':'review.html' };
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/scores') {
    req.query = Object.fromEntries(url.searchParams);
    res.status = code => { res.statusCode = code; return res; };
    res.json = data => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(data));
    };
    await scores(req, res);
    return;
  }
  const file = files[url.pathname];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try { const content = await readFile(file); res.writeHead(200, { 'Content-Type': `${types[file.slice(file.lastIndexOf('.'))]}; charset=utf-8`, 'X-Content-Type-Options': 'nosniff' }); res.end(content); }
  catch { res.writeHead(500); res.end('Unable to serve page'); }
}).listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173'));


