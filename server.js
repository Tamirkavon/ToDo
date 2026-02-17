// No dependencies — uses only built-in Node.js modules
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT = 3000;
const DIR  = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

// Proxy to api-football-v1.p.rapidapi.com
function proxyTo(apiPath, req, res) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Missing API key.' }));
  }

  const options = {
    hostname: 'api-football-v1.p.rapidapi.com',
    path:     apiPath,
    method:   'GET',
    headers:  {
      'X-RapidAPI-Key':  apiKey,
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
    },
  };

  const upstream = https.request(options, (upRes) => {
    const fwdHeaders = { 'Content-Type': 'application/json' };
    // Forward rate-limit info so the client can display it
    for (const h of ['x-ratelimit-requests-limit', 'x-ratelimit-requests-remaining']) {
      if (upRes.headers[h] != null) fwdHeaders[h] = upRes.headers[h];
    }
    res.writeHead(upRes.statusCode, fwdHeaders);
    upRes.pipe(res);
  });

  upstream.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `Upstream error: ${err.message}` }));
  });

  upstream.end();
}

http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const p      = parsed.pathname;

  // ── /api/today?date=YYYY-MM-DD  →  GET /v3/fixtures?date=... ──
  if (p === '/api/today') {
    const date = parsed.query.date || new Date().toISOString().slice(0, 10);
    return proxyTo(`/v3/fixtures?date=${encodeURIComponent(date)}`, req, res);
  }

  // ── /api/events/:id  →  GET /v3/fixtures/events?fixture=... ──
  const eventsMatch = p.match(/^\/api\/events\/(\d+)$/);
  if (eventsMatch) {
    return proxyTo(`/v3/fixtures/events?fixture=${eventsMatch[1]}`, req, res);
  }

  // ── Static files ──────────────────────────────────────────────
  const filePath = path.join(DIR, p === '/' ? 'football-scoreboard.html' : p);
  const ext      = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });

}).listen(PORT, () => {
  console.log('\n  \u26BD  Football Scoreboard \u2192 http://localhost:' + PORT + '\n');
  console.log('  Press Ctrl+C to stop.\n');
});
