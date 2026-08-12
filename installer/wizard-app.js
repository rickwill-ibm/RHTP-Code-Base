// wizard-app.js — RHTP Installer wizard client logic
// One responsibility: UI state, data fetching, form rendering, SSE progress.
// No inline data — all data loaded from /data/*.json.

let state = {
  mode:       'demo',
  components: [],
  userInputs: {},
  data:       {},   // loaded from /data/*.json
  prereqs:    [],
  jobToken:   null
};

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function init() {
  const [comps, prereqs] = await Promise.all([
    fetch('/data/components.json').then(r => r.json()),
    fetch('/data/prereqs.json').then(r => r.json())
  ]);
  state.data.components = comps;
  state.data.prereqs    = prereqs;
  renderPresets();
  renderComponents();
}

// ── Navigation ────────────────────────────────────────────────────────────────

function goTo(n) {
  for (let i = 1; i <= 5; i++) {
    document.getElementById(`screen-${i}`).classList.toggle('hidden', i !== n);
  }
  document.querySelectorAll('.step-tab').forEach((t, i) => {
    t.classList.toggle('active', i + 1 === n);
    t.classList.toggle('done',   i + 1 < n);
  });
  if (n === 3) renderConfig();
  if (n === 4) runPrereqCheck();
}

// ── Screen 1: Mode ────────────────────────────────────────────────────────────

function selectMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.mode-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.mode === mode);
  });
}

// ── Screen 2: Components ──────────────────────────────────────────────────────

function renderPresets() {
  const el = document.getElementById('presets');
  state.data.components.presets.forEach(p => {
    const btn = document.createElement('button');
    btn.className   = 'preset-btn';
    btn.textContent = p.label;
    btn.onclick     = () => applyPreset(p);
    el.appendChild(btn);
  });
}

function applyPreset(preset) {
  state.mode       = preset.mode;
  state.components = [...preset.components];
  selectMode(preset.mode);
  document.querySelectorAll('.comp-card').forEach(c => {
    const checked = state.components.includes(c.dataset.id);
    c.classList.toggle('selected', checked);
    c.querySelector('input').checked = checked;
  });
}

function renderComponents() {
  const grid = document.getElementById('compGrid');
  state.data.components.components.forEach(c => {
    const card = document.createElement('div');
    card.className    = 'comp-card';
    card.dataset.id   = c.id;
    card.innerHTML    = `
      <input type="checkbox" onchange="toggleComponent('${c.id}', this.checked)"/>
      <div class="comp-title">${c.label}</div>
      <div class="comp-desc">${c.description}</div>
      <div class="comp-port">Port: ${c.port}</div>`;
    grid.appendChild(card);
  });
}

function toggleComponent(id, checked) {
  const card = document.querySelector(`.comp-card[data-id="${id}"]`);
  card.classList.toggle('selected', checked);
  if (checked) { if (!state.components.includes(id)) state.components.push(id); }
  else         { state.components = state.components.filter(c => c !== id); }
}

// ── Screen 3: Config ──────────────────────────────────────────────────────────

function renderConfig() {
  const el = document.getElementById('configSections');
  el.innerHTML = '';
  if (state.components.length === 0) {
    el.innerHTML = '<div class="alert alert-warn">No components selected. Go back and select at least one.</div>';
    return;
  }
  state.components.forEach(id => el.appendChild(buildConfigSection(id)));
  if (state.mode === 'production' && (state.components.includes('golden-thread') || state.components.includes('pa-standalone'))) {
    el.appendChild(buildLlmSection());
  }
}

function buildConfigSection(id) {
  const labels = { rhtp: 'RHTP Clinical Platform', cms: 'CMS Mandates (CMS-0057-F)', 'golden-thread': 'Golden Thread / RCM', 'pa-standalone': 'PA Standalone SmartApp' };
  const wrap  = document.createElement('div');
  wrap.className = 'accordion';
  const header = document.createElement('div');
  header.className = 'accordion-header';
  header.innerHTML = `<span>${labels[id]}</span><span>▼</span>`;
  header.onclick   = () => body.classList.toggle('open');
  const body = document.createElement('div');
  body.className   = 'accordion-body open';

  if (id === 'cms' && state.mode === 'production') {
    body.appendChild(buildWso2Fields());
  } else {
    body.innerHTML = `<div class="text-sm">Auto-configured for <strong>${state.mode}</strong> mode. No manual settings required.</div>`;
  }
  wrap.appendChild(header);
  wrap.appendChild(body);
  return wrap;
}

function buildWso2Fields() {
  const fields = [
    { key: 'FHIR_GATEWAY_BASE',  label: 'FHIR Gateway Base URL',     hint: 'e.g. https://localhost:8243/fhir/r4', required: true },
    { key: 'CDS_GATEWAY_BASE',   label: 'CDS Hooks Gateway Base URL', hint: 'e.g. https://localhost:8243/cds',     required: true },
    { key: 'BULK_GATEWAY_BASE',  label: 'Bulk Export Gateway URL',    hint: 'e.g. https://localhost:8243/bulk',    required: true },
    { key: 'WSO2_AUTHORIZE_URL', label: 'WSO2 IS Authorize URL',      hint: 'e.g. https://localhost:9453/oauth2/authorize', required: true },
    { key: 'WSO2_TOKEN_URL',     label: 'WSO2 IS Token URL',          hint: 'e.g. https://localhost:9453/oauth2/token',    required: true },
    { key: 'WSO2_CLIENT_ID',     label: 'APIM OAuth Client ID',       hint: 'From the APIM Developer Portal app',  required: true },
    { key: 'WSO2_CLIENT_SECRET', label: 'APIM OAuth Client Secret',   hint: 'From the APIM Developer Portal app',  required: true, secret: true }
  ];
  const wrap = document.createElement('div');
  fields.forEach(f => wrap.appendChild(buildField(f)));
  return wrap;
}

function buildLlmSection() {
  const wrap = document.createElement('div');
  wrap.className = 'accordion';
  const header = document.createElement('div');
  header.className = 'accordion-header';
  header.innerHTML = '<span>🤖 LLM Configuration (Policy Engine)</span><span>▼</span>';
  header.onclick = () => body.classList.toggle('open');
  const body = document.createElement('div');
  body.className = 'accordion-body open';
  body.innerHTML = `
    <div class="alert alert-info">Required for live policy extraction in Golden Thread and PA Standalone. Optional — without a key the engine uses pre-seeded policies only.</div>
    <div class="llm-toggle">
      <div class="llm-option selected" id="llmGroq" onclick="selectLlm('groq')">
        <div class="llm-option-title">Groq <span class="badge badge-green">Free</span></div>
        <div class="llm-option-sub">No credit card. <a href="https://console.groq.com/keys" target="_blank">Get a key</a></div>
      </div>
      <div class="llm-option" id="llmOpenai" onclick="selectLlm('openai')">
        <div class="llm-option-title">OpenAI GPT-4o</div>
        <div class="llm-option-sub">Requires billing account</div>
      </div>
    </div>
    <div id="llmKeyField">
      ${buildField({ key: 'GROQ_API_KEY', label: 'Groq API Key', hint: 'Starts with gsk_', secret: true, placeholder: 'gsk_...' }).outerHTML}
    </div>`;
  state.userInputs['LLM_PROVIDER'] = 'groq';
  wrap.appendChild(header);
  wrap.appendChild(body);
  return wrap;
}

function selectLlm(provider) {
  state.userInputs['LLM_PROVIDER'] = provider;
  document.getElementById('llmGroq').classList.toggle('selected',  provider === 'groq');
  document.getElementById('llmOpenai').classList.toggle('selected', provider === 'openai');
  const keyField = document.getElementById('llmKeyField');
  keyField.innerHTML = buildField(provider === 'groq'
    ? { key: 'GROQ_API_KEY',   label: 'Groq API Key',       hint: 'Starts with gsk_',  secret: true, placeholder: 'gsk_...' }
    : { key: 'OPENAI_API_KEY', label: 'OpenAI API Key',     hint: 'Starts with sk-',   secret: true, placeholder: 'sk-...'  }
  ).outerHTML;
}

function buildField({ key, label, hint, required, secret, placeholder }) {
  const row = document.createElement('div');
  row.className = 'field-row';
  row.innerHTML = `
    <div class="field-label">
      ${label}
      ${required ? '<span class="field-required">required</span>' : ''}
    </div>
    <input class="field-input" type="${secret ? 'password' : 'text'}"
      id="field_${key}" placeholder="${placeholder || ''}"
      oninput="state.userInputs['${key}'] = this.value"/>
    ${hint ? `<div class="field-hint">${hint}</div>` : ''}`;
  return row;
}

// ── Screen 4: Prereq Check ────────────────────────────────────────────────────

async function runPrereqCheck() {
  const list = document.getElementById('prereqList');
  list.innerHTML = '';
  const btn = document.getElementById('btnInstall');
  btn.disabled = true;

  const toCheck = state.data.prereqs.prereqs.filter(p => {
    if (p.required === 'optional') return false;
    if (p.required === 'production' && state.mode !== 'production') return false;
    if (p.components && !p.components.some(c => state.components.includes(c))) return false;
    return true;
  });

  const portSpec = state.data.prereqs.ports.filter(p => {
    if (p.components && !p.components.some(c => state.components.includes(c))) return false;
    if (p.mode && p.mode !== state.mode) return false;
    return true;
  });

  let allOk = true;

  for (const p of toCheck) {
    const li = addPrereqItem(list, p.id, p.label, 'checking', '...');
    const result = await checkPrereq(p);
    updatePrereqItem(li, result.status, result.message || result.version || '');
    if (result.status === 'error') { allOk = false; addFixLink(li, p); }
  }

  for (const p of portSpec) {
    const li = addPrereqItem(list, `port-${p.port}`, `Port ${p.port} (${p.label})`, 'checking', '...');
    const inUse = await checkPort(p.port);
    if (inUse) {
      updatePrereqItem(li, 'warn', `In use — will attempt to free before starting`);
    } else {
      updatePrereqItem(li, 'ok', 'Available');
    }
  }

  btn.disabled = !allOk;
  if (!allOk) btn.title = 'Fix errors above before installing';
}

async function checkPrereq(p) {
  try {
    const r = await fetch(`/api/check-prereq?id=${p.id}`);
    return await r.json();
  } catch { return { status: 'error', message: 'Could not check' }; }
}

async function checkPort(port) {
  try {
    const r = await fetch(`/api/status`);
    const s = await r.json();
    return s.ports[String(port)] === 'running';
  } catch { return false; }
}

function addPrereqItem(list, id, label, status, message) {
  const li = document.createElement('li');
  li.className = 'prereq-item';
  li.id = `prereq-${id}`;
  li.innerHTML = `<div class="prereq-status status-checking" id="ps-${id}">?</div><div><strong>${label}</strong><span id="pm-${id}" style="color:#57606a;font-size:12px;margin-left:8px">${message}</span></div>`;
  list.appendChild(li);
  return li;
}

function updatePrereqItem(li, status, message) {
  const dot  = li.querySelector('.prereq-status');
  const msg  = li.querySelector('[id^="pm-"]');
  const icons = { ok: '✓', error: '✗', warn: '!', checking: '?' };
  const cls   = { ok: 'status-ok', error: 'status-error', warn: 'status-warn', checking: 'status-checking' };
  dot.className   = `prereq-status ${cls[status] || 'status-checking'}`;
  dot.textContent = icons[status] || '?';
  if (msg) msg.textContent = message;
}

function addFixLink(li, p) {
  if (!p.fixUrl) return;
  const a = document.createElement('a');
  a.href = p.fixUrl; a.target = '_blank';
  a.textContent = p.fixText || 'Fix it';
  a.style.cssText = 'font-size:11px;color:#3b82d4;margin-left:8px';
  li.appendChild(a);
}

// ── Screen 5: Install ─────────────────────────────────────────────────────────

async function startInstall() {
  goTo(5);
  const resp = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ mode: state.mode, components: state.components, userInputs: state.userInputs })
  });
  const { token } = await resp.json();
  state.jobToken = token;

  const stepsEl = document.getElementById('progressSteps');
  stepsEl.innerHTML = '';

  const evtSrc = new EventSource(`/api/run/${token}`);
  const stepEls = {};

  evtSrc.addEventListener('step-start', e => {
    const d = JSON.parse(e.data);
    const div = document.createElement('div');
    div.className = 'progress-step';
    div.id = `ps-${d.id}`;
    div.innerHTML = `
      <div class="progress-step-header" onclick="this.nextSibling.classList.toggle('visible')">
        <span id="psi-${d.id}" style="font-weight:700">⏳ ${d.label}</span>
      </div>
      <div class="progress-log" id="psl-${d.id}"></div>`;
    stepsEl.appendChild(div);
    stepEls[d.id] = div;
  });

  evtSrc.addEventListener('log', e => {
    const d = JSON.parse(e.data);
    const log = document.getElementById(`psl-${d.id}`);
    if (log) { log.textContent += d.line + '\n'; log.scrollTop = log.scrollHeight; }
  });

  evtSrc.addEventListener('step-done', e => {
    const d = JSON.parse(e.data);
    const icon = document.getElementById(`psi-${d.id}`);
    if (icon) icon.textContent = (d.status === 'ok' ? '✅' : '❌') + ' ' + icon.textContent.slice(2);
  });

  evtSrc.addEventListener('done', () => {
    evtSrc.close();
    document.getElementById('progressSub').textContent = 'Installation complete!';
    showLaunchPanel();
  });
}

function showLaunchPanel() {
  const panel = document.getElementById('launchPanel');
  const grid  = document.getElementById('launchGrid');
  panel.classList.remove('hidden');
  grid.innerHTML = '';
  state.components.forEach(id => {
    const comp = state.data.components.components.find(c => c.id === id);
    if (!comp) return;
    const card = document.createElement('div');
    card.className = 'launch-card';
    card.innerHTML = `<div class="launch-card-title">${comp.label}</div>` +
      comp.demoUrls.map(u => `<a class="launch-link" href="${comp.url.replace(/\/$/, '')}${u.path}" target="_blank">${u.label}</a>`).join('');
    grid.appendChild(card);
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
init();
