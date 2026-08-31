import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(root, 'public');
const dbPath = join(root, 'data', 'store.json');
const users = [
  { id: 'u-ava', name: 'Ava Patel', email: 'ava@ajaia.test' },
  { id: 'u-maya', name: 'Maya Chen', email: 'maya@ajaia.test' },
  { id: 'u-leo', name: 'Leo Martin', email: 'leo@ajaia.test' }
];

export function cleanHtml(value = '') {
  return String(value).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '').replace(/javascript:/gi, '');
}
export function visibleDocs(store, userId) {
  return store.documents.filter(d => d.ownerId === userId || d.sharedWith.includes(userId));
}
async function readStore() {
  if (!existsSync(dbPath)) return { documents: [] };
  return JSON.parse(await readFile(dbPath, 'utf8'));
}
async function saveStore(store) {
  await mkdir(join(root, 'data'), { recursive: true });
  await writeFile(dbPath, JSON.stringify(store, null, 2));
}
function json(res, status, body) { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); }
function getBody(req) { return new Promise((resolve, reject) => { let body = ''; req.on('data', c => body += c); req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); } }); }); }
function findDoc(store, id) { return store.documents.find(d => d.id === id); }
function canRead(doc, userId) { return doc && (doc.ownerId === userId || doc.sharedWith.includes(userId)); }
function canEdit(doc, userId) { return doc?.ownerId === userId; }

async function api(req, res, url) {
  const actor = req.headers['x-user-id'] || 'u-ava';
  const store = await readStore();
  if (url.pathname === '/api/users' && req.method === 'GET') return json(res, 200, users);
  if (url.pathname === '/api/documents' && req.method === 'GET') return json(res, 200, visibleDocs(store, actor));
  if (url.pathname === '/api/documents' && req.method === 'POST') {
    const body = await getBody(req); const title = String(body.title || 'Untitled document').trim().slice(0, 120);
    const doc = { id: crypto.randomUUID(), title: title || 'Untitled document', content: '<p>Start writing here…</p>', ownerId: actor, sharedWith: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    store.documents.unshift(doc); await saveStore(store); return json(res, 201, doc);
  }
  const match = url.pathname.match(/^\/api\/documents\/([^/]+)(?:\/(share))?$/);
  if (!match) return json(res, 404, { error: 'Not found' });
  const doc = findDoc(store, match[1]);
  if (!canRead(doc, actor)) return json(res, 404, { error: 'Document not found or access denied' });
  if (match[2] === 'share' && req.method === 'POST') {
    if (!canEdit(doc, actor)) return json(res, 403, { error: 'Only the owner can share this document' });
    const { userId } = await getBody(req);
    if (!users.some(u => u.id === userId) || userId === actor) return json(res, 422, { error: 'Choose a valid teammate' });
    if (!doc.sharedWith.includes(userId)) doc.sharedWith.push(userId);
    doc.updatedAt = new Date().toISOString(); await saveStore(store); return json(res, 200, doc);
  }
  if (req.method === 'GET') return json(res, 200, doc);
  if (req.method === 'PUT') {
    if (!canEdit(doc, actor)) return json(res, 403, { error: 'Shared documents are view-only in this prototype' });
    const body = await getBody(req);
    if (body.title !== undefined) doc.title = String(body.title).trim().slice(0, 120) || 'Untitled document';
    if (body.content !== undefined) doc.content = cleanHtml(body.content).slice(0, 200000);
    doc.updatedAt = new Date().toISOString(); await saveStore(store); return json(res, 200, doc);
  }
  return json(res, 405, { error: 'Method not allowed' });
}

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };
export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    const requested = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const path = join(publicDir, requested);
    if (!path.startsWith(publicDir) || !existsSync(path)) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' }); res.end(await readFile(path));
  } catch (error) { json(res, 400, { error: error.message || 'Request failed' }); }
});
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  server.on('error', error => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Open http://localhost:${port}, stop the other server, or run with a different port (PowerShell: $env:PORT=3001; node server.js).`);
    } else console.error(error);
    process.exitCode = 1;
  });
  server.listen(port, () => console.log(`Ajaia Docs running at http://localhost:${port}`));
}
