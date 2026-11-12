import http from 'node:http';
import { readFile } from 'node:fs/promises';
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.mjs':'text/javascript', '.webp':'image/webp' };
const files = { '/daily-card/public-record-adapter.mjs':'daily-card/public-record-adapter.mjs', '/': 'index.html', '/index.html': 'index.html', '/styles.css': 'styles.css', '/app.js': 'app.js', '/favicon.svg': 'favicon.svg', '/records.js': 'records.js', '/post-admin.html':'post-admin.html', '/post-admin.mjs':'post-admin.mjs', '/spotlight-core.mjs':'spotlight-core.mjs', '/spotlight-public.mjs':'spotlight-public.mjs', '/spotlight-config.mjs':'spotlight-config.mjs', '/tfi-banner.webp':'tfi-banner.webp', '/tfi-logo.webp':'tfi-logo.webp', '/cashed-spotlight.webp':'cashed-spotlight.webp', '/review.html':'review.html' };
http.createServer(async (req, res) => {
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try { const content = await readFile(file); res.writeHead(200, { 'Content-Type': `${types[file.slice(file.lastIndexOf('.'))]}; charset=utf-8`, 'X-Content-Type-Options': 'nosniff' }); res.end(content); }
  catch { res.writeHead(500); res.end('Unable to serve page'); }
}).listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173'));


