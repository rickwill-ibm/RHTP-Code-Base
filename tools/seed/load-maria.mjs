#!/usr/bin/env node
/**
 * F-7 — load the demo member "Maria" into the FHIR server via the APIM gateway.
 *
 * Usage:
 *   FHIR_GATEWAY_BASE=https://localhost:8243/<ctx>/fhir/r4 \
 *   BEARER=<smart token> \
 *   node tools/seed/load-maria.mjs
 *
 * Posts the transaction Bundle. Requires a running backbone + a valid token
 * (ENV-1). Prints per-entry status. Node 18+ (global fetch).
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.FHIR_GATEWAY_BASE || 'http://localhost:8080/fhir/r4';
const bearer = process.env.BEARER || '';

async function main() {
  const bundle = JSON.parse(await readFile(path.join(__dirname, 'maria.bundle.json'), 'utf8'));
  const res = await fetch(base.replace(/\/$/, ''), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/fhir+json',
      Accept: 'application/fhir+json',
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify(bundle),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Seed failed: ${res.status}\n${text.slice(0, 500)}`);
    process.exit(1);
  }
  console.log(`Seed OK (${res.status}). Verify: GET ${base}/Patient/MARIA_SD_001`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
