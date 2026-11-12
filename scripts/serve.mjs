import http from 'node:http';
import { readFile } from 'node:fs/promises';
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.mjs':'text/javascript', '.webp':'image/webp' };
const files = { '/': 'index.html', '/index.html': 'index.html', '/styles.css': 'styles.css', '/app.js': 'app.js', '/favicon.svg': 'favicon.svg', '/records.js': 'records.js', '/post-admin.html':'post-admin.html', '/post-admin.mjs':'post-admin.mjs', '/spotlight-core.mjs':'spotlight-core.mjs', '/spotlight-public.mjs':'spotlight-public.mjs', '/spotlight-config.mjs':'spotlight-config.mjs', '/tfi-banner.webp':'tfi-banner.webp', '/tfi-logo.webp':'tfi-logo.webp', '/cashed-spotlight.webp':'cashed-spotlight.webp', '/review.html':'review.html' };
const memberRoutes = {
  '/api/member-login': '../api/member-login.js',
  '/api/member-callback': '../api/member-callback.js',
  '/api/member-logout': '../api/member-logout.js',
  '/api/member-picks': '../api/member-picks.js'
};
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (memberRoutes[url.pathname]) {
    req.query = Object.fromEntries(url.searchParams);
    res.status = code => { res.statusCode = code; return res; };
    res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
    res.redirect = (code, location) => { res.writeHead(code, {Location:location}); res.end(); };
    try { const route = await import(memberRoutes[url.pathname]); await route.default(req,res); }
    catch { res.writeHead(503, {'Cache-Control':'no-store'}); res.end('Member preview unavailable'); }
    return;
  }
  Object.assign(files, {'/members.html':'members.html','/members.mjs':'members.mjs','/members.css':'members.css','/live-score-core.mjs':'live-score-core.mjs'});
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try { const content = await readFile(new URL('../'+file, import.meta.url)); res.writeHead(200, { 'Content-Type': `${types[file.slice(file.lastIndexOf('.'))]}; charset=utf-8`, 'X-Content-Type-Options': 'nosniff' }); res.end(content); }
  catch { res.writeHead(500); res.end('Unable to serve page'); }
}).listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173'));



