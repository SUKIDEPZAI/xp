'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = path.resolve(__dirname, '..', 'ui');
const PORT = Number.parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';
const MIME = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.gif':'image/gif', '.ico':'image/x-icon', '.wasm':'application/wasm',
  '.txt':'text/plain; charset=utf-8', '.mp3':'audio/mpeg', '.mp4':'video/mp4', '.webm':'video/webm'
};

function send(res, status, body, type='text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/health') return send(res, 200, 'ok');

  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch { return send(res, 400, 'Bad request'); }
  if (pathname === '/') pathname = '/index.html';
  const filename = path.resolve(ROOT, `.${pathname}`);
  const rel = path.relative(ROOT, filename);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return send(res, 403, 'Forbidden');

  fs.stat(filename, (statError, stat) => {
    if (statError || !stat.isFile()) return send(res, 404, 'Not found');
    const type = MIME[path.extname(filename).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': filename.endsWith('.wasm') ? 'public, max-age=31536000, immutable' : 'no-cache'
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filename).on('error', () => { if (!res.headersSent) res.writeHead(500); res.end(); }).pipe(res);
  });
});

server.listen(PORT, HOST, () => process.stdout.write(`XP Living Desktop web server listening on http://${HOST}:${PORT}\n`));
server.on('error', error => { console.error(error); process.exitCode = 1; });
