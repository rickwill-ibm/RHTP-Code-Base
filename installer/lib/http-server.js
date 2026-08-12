// installer/lib/http-server.js
// Node.js HTTP + SSE server for the RHTP installer wizard.
// One responsibility: HTTP transport only. Business logic lives in steps/*.ps1.
//
// Routes:
//   GET  /                     → installer/wizard.html
//   GET  /wizard-app.js        → installer/wizard-app.js
//   GET  /data/<file>.json     → installer/data/<file>.json
//   GET  /api/check-prereq?id= → run one prereq check, return { status, version?, message? }
//   GET  /api/status           → { ports: { "4029": "running"|"stopped", ... } }
//   POST /api/config           → save wizard config, return { token }
//   GET  /api/run/<token>      → SSE stream: step-start, log, step-done, done

'use strict';

const http    = require('http');
const path    = require('path');
const fs      = require('fs');
const { exec, spawn } = require('child_process');
const net     = require('net');

// ── Constants ──────────────────────────────────────────────────────────────────

const PORT         = parseInt(process.env.INSTALLER_PORT || '9999', 10);
const INSTALLER_DIR = path.resolve(__dirname, '..');  // rhtpdemo/installer
const ROOT_DIR      = path.resolve(INSTALLER_DIR, '..'); // rhtpdemo

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
};

const CHECKED_PORTS = [4029, 4032, 8080, 8081, 8082, 8083, 8090, 3306];

// ── In-memory job store ────────────────────────────────────────────────────────

const jobs   = new Map();  // token → { status, config }
let  savedConfig = null;   // last POST /api/config body

// ── Server ────────────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url    = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method.toUpperCase();
  const urlPath = url.pathname;

  try {
    if (method === 'GET'  && urlPath === '/')                      return serveFile(res, path.join(INSTALLER_DIR, 'wizard.html'));
    if (method === 'GET'  && urlPath === '/wizard-app.js')         return serveFile(res, path.join(INSTALLER_DIR, 'wizard-app.js'));
    if (method === 'GET'  && urlPath.startsWith('/data/'))         return serveDataFile(res, urlPath);
    if (method === 'GET'  && urlPath === '/api/status')            return handleStatus(res);
    if (method === 'GET'  && urlPath === '/api/check-prereq')      return handleCheckPrereq(res, url.searchParams.get('id'));
    if (method === 'POST' && urlPath === '/api/config')            return handleConfig(req, res);
    if (method === 'GET'  && urlPath.startsWith('/api/run/'))      return handleRun(res, urlPath.slice('/api/run/'.length));
    return sendJson(res, 404, { error: `Not found: ${urlPath}` });
  } catch (err) {
    try { sendJson(res, 500, { error: err.message }); } catch {}
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[http-server] Installer wizard at http://localhost:${PORT}`);
});

// ── Static file handlers ──────────────────────────────────────────────────────

function serveFile(res, filePath) {
  if (!fs.existsSync(filePath)) {
    return sendJson(res, 404, { error: `File not found: ${filePath}` });
  }
  const ext  = path.extname(filePath).toLowerCase();
  const mime = CONTENT_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

function serveDataFile(res, urlPath) {
  const fileName = path.basename(urlPath);
  if (!fileName.endsWith('.json') || fileName.includes('..')) {
    return sendJson(res, 400, { error: 'Invalid data file request' });
  }
  const filePath = path.join(INSTALLER_DIR, 'data', fileName);
  serveFile(res, filePath);
}

// ── /api/status ───────────────────────────────────────────────────────────────

async function handleStatus(res) {
  const results = await Promise.all(CHECKED_PORTS.map(checkPort));
  const ports   = {};
  CHECKED_PORTS.forEach((p, i) => { ports[String(p)] = results[i] ? 'running' : 'stopped'; });
  sendJson(res, 200, { ports });
}

function checkPort(port) {
  return new Promise(resolve => {
    const sock = net.createConnection({ host: '127.0.0.1', port }, () => {
      sock.destroy();
      resolve(true);
    });
    sock.on('error', () => resolve(false));
    sock.setTimeout(400, () => { sock.destroy(); resolve(false); });
  });
}

// ── /api/check-prereq ─────────────────────────────────────────────────────────

function handleCheckPrereq(res, id) {
  if (!id) return sendJson(res, 400, { error: 'Missing id parameter' });

  const prereqsPath = path.join(INSTALLER_DIR, 'data', 'prereqs.json');
  const prereqs     = JSON.parse(fs.readFileSync(prereqsPath, 'utf8'));
  const spec        = prereqs.prereqs.find(p => p.id === id);

  if (!spec) return sendJson(res, 404, { error: `Unknown prereq: ${id}` });

  // exec() runs through the shell so .cmd wrappers (npm, docker, git) resolve on Windows PATH.
  exec(spec.command, { timeout: 8000 }, (err, stdout) => {
    if (err) {
      return sendJson(res, 200, { status: 'error', message: 'Not found' });
    }
    const output  = (stdout || '').trim();
    const pattern = spec.versionPattern ? new RegExp(spec.versionPattern) : null;
    const match   = pattern ? pattern.exec(output) : null;
    const version = match ? match[1] : output;

    if (spec.minVersion && match) {
      const ok = semverGte(version, spec.minVersion);
      return sendJson(res, 200, ok
        ? { status: 'ok',    version }
        : { status: 'error', version, message: `Requires ≥ ${spec.minVersion}` });
    }
    sendJson(res, 200, { status: 'ok', version });
  });
}

function semverGte(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0, nb = pb[i] || 0;
    if (na > nb) return true;
    if (na < nb) return false;
  }
  return true;
}

// ── /api/config ───────────────────────────────────────────────────────────────

function handleConfig(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const config = JSON.parse(body);
      const token  = require('crypto').randomBytes(16).toString('hex');
      savedConfig  = config;
      jobs.set(token, { status: 'pending', config });
      sendJson(res, 200, { token });
    } catch (err) {
      sendJson(res, 400, { error: 'Invalid JSON: ' + err.message });
    }
  });
}

// ── /api/run/<token> — SSE install stream ────────────────────────────────────

function handleRun(res, token) {
  const job = jobs.get(token);
  if (!job) return sendJson(res, 404, { error: 'Unknown token' });

  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  job.status = 'running';
  runInstallSteps(res, job.config);
}

function runInstallSteps(res, config) {
  const steps = buildStepList(config);
  let   idx   = 0;

  function next() {
    if (idx >= steps.length) {
      sendSse(res, 'done', { status: 'complete' });
      res.end();
      return;
    }
    const step = steps[idx++];
    sendSse(res, 'step-start', { id: step.id, label: step.label });
    runStep(res, step, config, err => {
      sendSse(res, 'step-done', { id: step.id, status: err ? 'error' : 'ok', error: err || undefined });
      next();
    });
  }
  next();
}

function runStep(res, step, config, done) {
  // Pass config as a JSON string via an env var — avoids PowerShell argument-quoting
  // pitfalls and keeps the step scripts' param signatures simple.
  const env = { ...process.env, RHTP_INSTALL_CONFIG: JSON.stringify(config) };

  const psArgs = [
    '-ExecutionPolicy', 'Bypass',
    '-NoProfile',
    '-File', step.scriptPath,
  ];

  const proc = spawn('powershell.exe', psArgs, { cwd: ROOT_DIR, env });

  proc.stdout.on('data', data => {
    String(data).split(/\r?\n/).filter(Boolean).forEach(line => {
      sendSse(res, 'log', { id: step.id, line });
    });
  });

  proc.stderr.on('data', data => {
    String(data).split(/\r?\n/).filter(Boolean).forEach(line => {
      sendSse(res, 'log', { id: step.id, line: `[stderr] ${line}` });
    });
  });

  proc.on('close', code => {
    done(code !== 0 ? `Exit code ${code}` : null);
  });

  proc.on('error', err => done(err.message));
}

function buildStepList(config) {
  const comps    = config.components || [];
  const stepsDir = path.join(INSTALLER_DIR, 'steps');
  const map = [
    { id: 'rhtp',          label: 'RHTP Clinical Platform',  file: 'rhtp.ps1' },
    { id: 'cms',           label: 'CMS Mandates (CMS-0057-F)', file: 'cms.ps1' },
    { id: 'golden-thread', label: 'Golden Thread / RCM',     file: 'golden-thread.ps1' },
    { id: 'pa-standalone', label: 'PA Standalone SmartApp',  file: 'pa-standalone.ps1' },
  ];
  return map
    .filter(s => comps.includes(s.id))
    .map(s => ({ ...s, scriptPath: path.join(stepsDir, s.file) }));
}

// ── SSE + JSON helpers ─────────────────────────────────────────────────────────

function sendSse(res, event, data) {
  const payload = JSON.stringify(data);
  res.write(`event: ${event}\ndata: ${payload}\n\n`);
}

function sendJson(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type':   'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}
