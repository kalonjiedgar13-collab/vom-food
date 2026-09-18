// ============================================================
// VOM FOOD — SERVEUR TEMPS RÉEL (Node.js, zéro dépendance)
// Sert l'application + synchronise client ⇄ admin en direct
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const STORE_FILE = path.join(ROOT, 'data', 'store.json');

// ---------- Stockage partagé (source de vérité serveur) ----------
let store = loadStore();
let sseClients = [];
let revision = 0;

function loadStore() {
  try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')); }
  catch (e) { return {}; }
}

let persistTimer = null;
function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
      fs.writeFileSync(STORE_FILE, JSON.stringify(store));
    } catch (e) { console.error('Persistance échouée:', e.message); }
  }, 400);
}

function broadcast(obj, exceptRes) {
  const msg = `data: ${JSON.stringify(obj)}\n\n`;
  for (const c of sseClients) {
    if (c === exceptRes) continue;
    try { c.write(msg); } catch (e) {}
  }
}

// ---------- Types MIME ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.zip': 'application/zip',
  '.mp3': 'audio/mpeg'
};

// ---------- Serveur HTTP ----------
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const p = decodeURIComponent(parsed.pathname);

  // ----- API : état complet -----
  if (p === '/api/state' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(store));
  }

  // ----- API : numéro de version (sondage léger) -----
  if (p === '/api/version' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ rev: revision }));
  }

  // ----- API : écrire une clé -----
  if (p === '/api/set' && req.method === 'POST') {
    let body = '';
    req.on('data', d => { body += d; if (body.length > 20 * 1024 * 1024) req.destroy(); });
    req.on('end', () => {
      try {
        const { key, value } = JSON.parse(body);
        if (!key || typeof key !== 'string') throw new Error('clé invalide');
        if (value === null) delete store[key];
        else store[key] = value;
        revision++;
        schedulePersist();
        broadcast({ type: 'update', key, value: value === null ? null : value });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // ----- API : événements temps réel (SSE) -----
  if (p === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.write('retry: 2000\n\n');
    res.write(`data: ${JSON.stringify({ type: 'hello', state: store })}\n\n`);
    sseClients.push(res);
    req.on('close', () => { sseClients = sseClients.filter(c => c !== res); });
    return;
  }

  // ----- Fichiers statiques -----
  let filePath = (p === '/' || p === '') ? '/welcome.html' : p;
  filePath = path.join(ROOT, path.normalize(filePath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Interdit'); }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404 — introuvable'); }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

// ---------- Battement de cœur SSE (garde les connexions ouvertes) ----------
setInterval(() => {
  for (const c of sseClients) { try { c.write(':hb\n\n'); } catch (e) {} }
}, 15000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ VOM FOOD — serveur temps réel en ligne sur http://localhost:${PORT}`);
  console.log(`   → App client :  http://localhost:${PORT}/index.html`);
  console.log(`   → Espace Admin : http://localhost:${PORT}/admin.html`);
  console.log(`   → ${Object.keys(store).length} clé(s) déjà en base`);
});
