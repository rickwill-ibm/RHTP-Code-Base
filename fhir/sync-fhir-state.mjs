#!/usr/bin/env node
/**
 * TCOC FHIR State Sync
 *
 * Exports the full FHIR server state to fhir/fhir-state.json (for git commit + push)
 * or imports it back into the local HAPI FHIR server (after git pull).
 *
 * Usage:
 *   node fhir/sync-fhir-state.mjs export   ← run after making changes (Jon)
 *   node fhir/sync-fhir-state.mjs import   ← run after git pull (Rick or Jon)
 *
 * Resource types synced:
 *   Patient, Observation, Condition, ServiceRequest, Task, Procedure, Flag, RiskAssessment
 *
 * The file fhir/fhir-state.json is committed to GitHub and auto-synced
 * by auto-sync-github.bat every 5 seconds — giving ~10-15s end-to-end lag.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = resolve(__dirname, 'fhir-state.json');

const argIdx = argv.indexOf('--fhir-url');
const FHIR_BASE = argIdx !== -1 ? argv[argIdx + 1] : 'http://localhost:8080/fhir';

const RESOURCE_TYPES = [
  'Patient',
  'Practitioner',
  'Observation',
  'Condition',
  'ServiceRequest',
  'Task',
  'Procedure',
  'Flag',
  'RiskAssessment',
];

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function fhirGet(path) {
  const res = await fetch(`${FHIR_BASE}/${path}`, {
    headers: { Accept: 'application/fhir+json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`GET ${path} → HTTP ${res.status}`);
  return res.json();
}

async function fhirPut(resourceType, id, resource) {
  const res = await fetch(`${FHIR_BASE}/${resourceType}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/fhir+json', Accept: 'application/fhir+json' },
    body: JSON.stringify(resource),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`PUT ${resourceType}/${id} → HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function waitForServer() {
  process.stdout.write('⏳  Waiting for FHIR server');
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${FHIR_BASE}/metadata`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) { console.log(' ✅'); return; }
    } catch { /* not ready */ }
    process.stdout.write('.');
    await sleep(2000);
  }
  throw new Error('FHIR server not reachable. Is Docker running?\n  docker compose -f fhir/docker-compose.yml up -d');
}

// ─── Export ───────────────────────────────────────────────────────────────────

async function exportState() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   TCOC FHIR State → fhir/fhir-state.json  (EXPORT)     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`FHIR server : ${FHIR_BASE}`);
  console.log(`Output file : ${STATE_FILE}\n`);

  await waitForServer();

  const state = {
    exportedAt: new Date().toISOString(),
    fhirBase: FHIR_BASE,
    resources: {},
  };

  let totalResources = 0;

  for (const resourceType of RESOURCE_TYPES) {
    process.stdout.write(`  Exporting ${resourceType.padEnd(16)}`);
    try {
      const bundle = await fhirGet(`${resourceType}?_count=500`);
      const resources = (bundle.entry ?? [])
        .map(e => e.resource)
        .filter(Boolean);
      state.resources[resourceType] = resources;
      totalResources += resources.length;
      console.log(`${resources.length} resources`);
    } catch (err) {
      console.log(`⚠  ${err.message}`);
      state.resources[resourceType] = [];
    }
  }

  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

  console.log(`\n─────────────────────────────────────────────────`);
  console.log(`  Total exported : ${totalResources} resources`);
  console.log(`  Written to     : fhir/fhir-state.json`);
  console.log(`  Auto-sync will push this to GitHub within 5 seconds.`);
  console.log(`  Your colleague runs: node fhir/sync-fhir-state.mjs import`);
}

// ─── Import ───────────────────────────────────────────────────────────────────

async function importState() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   fhir/fhir-state.json → TCOC FHIR Server  (IMPORT)    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`FHIR server : ${FHIR_BASE}`);
  console.log(`Input file  : ${STATE_FILE}\n`);

  // Read state file
  let state;
  try {
    state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    console.error('❌  fhir/fhir-state.json not found or invalid.');
    console.error('    Run "node fhir/sync-fhir-state.mjs export" on the other machine first.');
    process.exit(1);
  }

  const age = Math.round((Date.now() - new Date(state.exportedAt).getTime()) / 1000);
  console.log(`  Exported at : ${state.exportedAt}`);
  console.log(`  State age   : ${age < 60 ? age + 's' : Math.round(age/60) + 'm'} ago\n`);

  await waitForServer();

  let success = 0;
  let failed = 0;

  for (const resourceType of RESOURCE_TYPES) {
    const resources = state.resources[resourceType] ?? [];
    if (resources.length === 0) continue;

    process.stdout.write(`  Importing ${resourceType.padEnd(16)}`);
    let typeSuccess = 0;
    let typeFailed = 0;

    for (const resource of resources) {
      if (!resource.id) continue;
      try {
        await fhirPut(resourceType, resource.id, resource);
        typeSuccess++;
        success++;
      } catch (err) {
        typeFailed++;
        failed++;
        // Only log individual errors in verbose mode
        if (argv.includes('--verbose')) {
          console.error(`\n    ⚠  ${resource.id}: ${err.message}`);
        }
      }
    }

    if (typeFailed > 0) {
      console.log(`${typeSuccess} ok, ${typeFailed} failed`);
    } else {
      console.log(`${typeSuccess} resources`);
    }
  }

  console.log(`\n─────────────────────────────────────────────────`);
  console.log(`  Imported : ${success} resources`);
  if (failed > 0) console.log(`  Failed   : ${failed} (run with --verbose to see details)`);
  console.log(`  Your local FHIR server is now in sync.`);
  console.log(`  Restart the dev server if it's already running: npm run dev`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const command = argv[2];

if (command === 'export') {
  exportState().catch(err => { console.error('\n💥  Fatal:', err.message); process.exit(1); });
} else if (command === 'import') {
  importState().catch(err => { console.error('\n💥  Fatal:', err.message); process.exit(1); });
} else {
  console.log('TCOC FHIR State Sync');
  console.log('');
  console.log('Usage:');
  console.log('  node fhir/sync-fhir-state.mjs export   — snapshot FHIR server → fhir-state.json');
  console.log('  node fhir/sync-fhir-state.mjs import   — load fhir-state.json → FHIR server');
  console.log('');
  console.log('Options:');
  console.log('  --fhir-url <url>   Override FHIR base URL (default: http://localhost:8080/fhir)');
  console.log('  --verbose          Show individual resource errors during import');
  process.exit(0);
}
