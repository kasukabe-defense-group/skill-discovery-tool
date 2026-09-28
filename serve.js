const http = require('http');
const fs = require('fs');
const path = require('path');
const { ensureKeys } = require('./lib/setup');

const root = __dirname;
const port = process.env.PORT || 5173;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const PUBLIC = new Set(['/index.html']);

ensureKeys().then(() => {
const search = require('./api/search');
http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  if (urlPath === '/api/search') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10000) { res.writeHead(413); res.end(); req.destroy(); }
    });
    req.on('end', () => {
      try { req.body = JSON.parse(body || '{}'); } catch (e) { req.body = {}; }
      search(req, res);
    });
    return;
  }

  const file = urlPath === '/' ? '/index.html' : urlPath;
  if (!PUBLIC.has(file)) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(path.join(root, file), (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Cache-Control': 'no-store' });
    if (!/^\s*<!doctype/i.test(data.toString('utf8', 0, 64))) {
      data = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>' + data + '</body></html>';
    }
    res.end(data);
  });
}).listen(port, () => console.log(`Serving on http://localhost:${port}`));
});
