#!/usr/bin/env node
/**
 * seed-all.mjs — seeds every FHIR test-patient bundle in this directory into
 * EMR (:8080) and payer (:8082).
 *
 * Bundles are auto-discovered by filename convention: any `<slug>-emr.bundle.json`
 * is posted to the EMR server, any `<slug>-payer.bundle.json` to the payer
 * server. This directory originally shipped with only the Rachel Green pair;
 * use generate-patient.mjs to scaffold additional synthetic test patients —
 * they're picked up automatically here with no code change.
 *
 * Usage:
 *   node PA-Standalone-SmartApp/infra/seed/seed-all.mjs
 *
 * Run from the workspace root (Prior Authorization Rebuild/).
 * HAPI servers must already be running.
 */

import { readFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

const EMR_BASE   = process.env.EMR_FHIR_BASE   ?? "http://localhost:8080/fhir";
const PAYER_BASE = process.env.PAYER_FHIR_BASE  ?? "http://localhost:8082/fhir";

function discoverSeeds() {
  const files = readdirSync(__dir).filter((f) => f.endsWith(".bundle.json"));
  const seeds = [];
  for (const file of files) {
    const emrMatch = file.match(/^(.+)-emr\.bundle\.json$/);
    const payerMatch = file.match(/^(.+)-payer\.bundle\.json$/);
    if (emrMatch) {
      seeds.push({ label: `${toTitle(emrMatch[1])} — EMR`, file, base: EMR_BASE });
    } else if (payerMatch) {
      seeds.push({ label: `${toTitle(payerMatch[1])} — Payer`, file, base: PAYER_BASE });
    }
  }
  // Deterministic order: EMR bundles first, then payer, alphabetical within each.
  return seeds.sort((a, b) => a.base === b.base ? a.label.localeCompare(b.label) : (a.base === EMR_BASE ? -1 : 1));
}

function toTitle(slug) {
  return slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

const SEEDS = discoverSeeds();

async function postBundle(label, filePath, base) {
  const raw = readFileSync(filePath, "utf-8");
  const bundle = JSON.parse(raw);

  console.log(`\n[${label}] → ${base}`);
  console.log(`  Bundle: ${bundle.id}  (${bundle.entry.length} entries)`);

  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/fhir+json", "Accept": "application/fhir+json" },
    body: raw,
  });

  const body = await res.json();

  if (!res.ok) {
    console.error(`  ✗ HTTP ${res.status}`);
    if (body.issue) body.issue.forEach(i => console.error(`    ${i.severity}: ${i.diagnostics}`));
    return false;
  }

  if (body.resourceType === "Bundle") {
    const entries = body.entry ?? [];
    const ok  = entries.filter(e => e.response?.status?.startsWith("2")).length;
    const err = entries.filter(e => !e.response?.status?.startsWith("2")).length;
    entries.forEach(e => {
      const s = e.response?.status ?? "?";
      const loc = e.response?.location ?? "?";
      console.log(`  ${s.startsWith("2") ? "✓" : "✗"} ${s} — ${loc}`);
    });
    console.log(`  → ${ok} succeeded, ${err} failed`);
    return err === 0;
  }

  console.log(`  Response: ${JSON.stringify(body).slice(0, 200)}`);
  return false;
}

async function waitForFhir(base, label, retries = 20) {
  for (let i = 1; i <= retries; i++) {
    try {
      const r = await fetch(`${base}/metadata`, { signal: AbortSignal.timeout(3000) });
      if (r.ok) { console.log(`  ✓ ${label} (${base}) is ready`); return true; }
    } catch {}
    console.log(`  Waiting for ${label}… (${i}/${retries})`);
    await new Promise(r => setTimeout(r, 3000));
  }
  console.error(`  ✗ ${label} did not become ready`);
  return false;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║   PA Standalone — FHIR Seed Script               ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`\nEMR FHIR:   ${EMR_BASE}`);
  console.log(`Payer FHIR: ${PAYER_BASE}`);

  if (SEEDS.length === 0) {
    console.error(`\nNo *-emr.bundle.json / *-payer.bundle.json files found in ${__dir}`);
    console.error(`Generate one with: node ${resolve(__dir, "generate-patient.mjs")} --help`);
    process.exit(1);
  }

  console.log(`\nDiscovered ${SEEDS.length} bundle(s):`);
  for (const s of SEEDS) console.log(`  - ${s.label} (${s.file})`);

  console.log("\n[Waiting for FHIR servers to be ready…]");
  const emrReady   = await waitForFhir(EMR_BASE,   "EMR FHIR");
  const payerReady = await waitForFhir(PAYER_BASE, "Payer FHIR");

  if (!emrReady)   console.warn("WARNING: EMR FHIR not ready — EMR seeds may fail");
  if (!payerReady) console.warn("WARNING: Payer FHIR not ready — payer seeds may fail");

  let allOk = true;
  const patientIds = [];
  for (const { label, file, base } of SEEDS) {
    const filePath = resolve(__dir, file);
    const bundle = JSON.parse(readFileSync(filePath, "utf-8"));
    const firstPatient = bundle.entry?.find((e) => e.resource?.resourceType === "Patient")?.resource?.id;
    if (firstPatient && base === EMR_BASE) patientIds.push(firstPatient);
    const ok = await postBundle(label, filePath, base);
    if (!ok) allOk = false;
  }

  console.log("\n" + "─".repeat(52));
  if (allOk) {
    console.log("✓ All seeds complete.");
    console.log("\nVerify:");
    for (const id of patientIds) {
      console.log(`  curl "${EMR_BASE}/Patient/${id}" | jq '.name'`);
    }
    console.log(`\nAny of the above patient ids can be entered directly into the SmartApp's "Load Patient" field.`);
  } else {
    console.error("✗ Some seeds failed — check output above.");
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
