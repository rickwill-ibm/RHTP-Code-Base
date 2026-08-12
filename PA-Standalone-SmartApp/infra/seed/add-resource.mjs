#!/usr/bin/env node
/**
 * add-resource.mjs — add one more clinical resource to an ALREADY-SEEDED
 * patient, for testing DTR match logic without hand-writing FHIR JSON or a
 * one-off curl.
 *
 * generate-patient.mjs solves "scaffold a brand-new synthetic patient."
 * Nothing before this solved "add one more Condition/Observation/Procedure
 * to the existing Rachel Green record so a DTR comorbidity group flips from
 * gap to met." That's what this does — two things happen, both needed:
 *
 *   1. POSTs the new resource straight to the already-running mock FHIR
 *      server, so the DTR result changes immediately without a restart
 *      (mock-fhir-server is in-memory only — see its own header comment).
 *   2. Appends the same entry to the checked-in <slug>-<target>.bundle.json
 *      file, so the addition survives a restart and becomes part of the
 *      permanent fixture the next time seed-all.mjs runs, instead of
 *      evaporating.
 *
 * Usage:
 *   node add-resource.mjs --slug rachel-green --target emr \
 *     --resource-type Condition --code I27.20 --system icd-10-cm \
 *     --text "Pulmonary hypertension, unspecified" \
 *     [--effective-date 2026-06-01] [--performer practitioner-aagaard]
 *
 *   node add-resource.mjs --slug rachel-green --target emr \
 *     --resource-type Observation --code 39156-5 --system loinc \
 *     --text "Body mass index (BMI) [Ratio]" --value 37.1 --unit kg/m2 \
 *     [--effective-date 2026-01-15]
 *
 *   node add-resource.mjs --slug rachel-green --target emr \
 *     --resource-type Procedure --code 43644 --system cpt \
 *     --text "Laparoscopic gastric bypass" [--performed-date 2025-03-01]
 *
 * --slug matches the <slug>-emr.bundle.json / <slug>-payer.bundle.json
 * naming convention generate-patient.mjs and seed-all.mjs already use.
 * --target chooses which bundle file (and which running FHIR server) to
 * write to; the subject reference is resolved from whichever Patient
 * resource is actually in that bundle, not assumed from the slug (EMR and
 * payer bundles use different patient ids for the same person — see
 * rachel-green-emr.bundle.json's patient-rachel-green vs.
 * rachel-green-payer.bundle.json's patient-rachel-green-payer).
 *
 * Run from the workspace root (Prior Authorization Rebuild/).
 * The relevant mock-fhir-server instance must already be running for the
 * live POST to succeed; the bundle-file write happens either way.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dir = dirname(fileURLToPath(import.meta.url));

const EMR_BASE = process.env.EMR_FHIR_BASE ?? "http://localhost:8080/fhir";
const PAYER_BASE = process.env.PAYER_FHIR_BASE ?? "http://localhost:8082/fhir";

const SYSTEM_ALIASES = {
  "icd-10-cm": "http://hl7.org/fhir/sid/icd-10-cm",
  icd10: "http://hl7.org/fhir/sid/icd-10-cm",
  loinc: "http://loinc.org",
  cpt: "http://www.ama-assn.org/go/cpt",
  snomed: "http://snomed.info/sct",
};

const RESOURCE_TYPES = ["Condition", "Observation", "Procedure"];

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function printUsageAndExit() {
  console.log(`
add-resource.mjs — add one clinical resource to an already-seeded patient

Required:
  --slug            Existing seed slug, e.g. rachel-green (matches
                     <slug>-emr.bundle.json / <slug>-payer.bundle.json)
  --target          emr | payer — which bundle/server to write to
  --resource-type   Condition | Observation | Procedure
  --code            Code value, e.g. I27.20 / 39156-5 / 43644
  --text            Human-readable display text

Optional:
  --system          icd-10-cm | loinc | cpt | snomed | a literal system URL
                     (default: icd-10-cm)
  --value            Observation numeric value (e.g. 37.1)
  --unit             Observation unit (e.g. "kg/m2") — required if --value given
  --effective-date  Condition onset/recorded date or Observation effective date
                     (default: today)
  --performed-date  Procedure performed date (default: today)
  --performer       Practitioner id already in the target bundle, e.g.
                     practitioner-aagaard — sets Condition.recorder /
                     Procedure.performer
  --id              Explicit resource id (default: auto-generated)
  --force           Skip the "already exists" guard when --id collides

Examples:
  node add-resource.mjs --slug rachel-green --target emr \\
    --resource-type Condition --code I27.20 --system icd-10-cm \\
    --text "Pulmonary hypertension, unspecified" --performer practitioner-aagaard

  node add-resource.mjs --slug rachel-green --target emr \\
    --resource-type Observation --code 39156-5 --system loinc \\
    --text "Body mass index (BMI) [Ratio]" --value 37.1 --unit kg/m2
`);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
if (Object.keys(args).length === 0) printUsageAndExit();

const REQUIRED = ["slug", "target", "resource-type", "code", "text"];
const missing = REQUIRED.filter((k) => !args[k]);
if (missing.length > 0) {
  console.error(`Missing required argument(s): ${missing.map((m) => `--${m}`).join(", ")}\n`);
  printUsageAndExit();
}

const slug = String(args.slug).trim();
const target = String(args.target).trim();
const resourceType = String(args["resource-type"]).trim();
const code = String(args.code).trim();
const text = String(args.text).trim();
const systemArg = String(args.system ?? "icd-10-cm").trim();
const system = SYSTEM_ALIASES[systemArg] ?? systemArg;
const value = args.value !== undefined ? Number(args.value) : undefined;
const unit = args.unit ? String(args.unit).trim() : undefined;
const effectiveDate = args["effective-date"] ? String(args["effective-date"]).trim() : new Date().toISOString().slice(0, 10);
const performedDate = args["performed-date"] ? String(args["performed-date"]).trim() : new Date().toISOString().slice(0, 10);
const performer = args.performer ? String(args.performer).trim() : null;
const force = args.force === true;

if (target !== "emr" && target !== "payer") {
  console.error(`--target must be "emr" or "payer" (got "${target}")`);
  process.exit(1);
}
if (!RESOURCE_TYPES.includes(resourceType)) {
  console.error(`--resource-type must be one of ${RESOURCE_TYPES.join(", ")} (got "${resourceType}")`);
  process.exit(1);
}
if (value !== undefined && !unit) {
  console.error(`--unit is required when --value is given`);
  process.exit(1);
}

const bundleFile = `${slug}-${target}.bundle.json`;
const bundlePath = resolve(__dir, bundleFile);
if (!existsSync(bundlePath)) {
  const available = readdirSync(__dir).filter((f) => f.endsWith(".bundle.json"));
  console.error(`No such bundle file: ${bundleFile}`);
  console.error(`Available: ${available.join(", ") || "(none)"}`);
  console.error(`New patient? Use generate-patient.mjs first.`);
  process.exit(1);
}

const bundle = JSON.parse(readFileSync(bundlePath, "utf-8"));
const patientEntry = bundle.entry?.find((e) => e.resource?.resourceType === "Patient");
if (!patientEntry) {
  console.error(`No Patient resource found in ${bundleFile} — can't resolve a subject reference.`);
  process.exit(1);
}
const patientId = patientEntry.resource.id;

const id = args.id ? String(args.id).trim() : `${resourceType.toLowerCase()}-${slug}-${crypto.randomUUID().slice(0, 8)}`;
if (!force && bundle.entry.some((e) => e.resource?.id === id)) {
  console.error(`Resource id "${id}" already exists in ${bundleFile}. Pass --force to add anyway, or omit --id to auto-generate.`);
  process.exit(1);
}

function buildResource() {
  const codeableConcept = { coding: [{ system, code, display: text }], text };
  const subject = { reference: `Patient/${patientId}` };

  if (resourceType === "Condition") {
    return {
      resourceType: "Condition",
      id,
      clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
      verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed" }] },
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "problem-list-item" }] }],
      code: codeableConcept,
      subject,
      onsetDateTime: effectiveDate,
      recordedDate: effectiveDate,
      ...(performer ? { recorder: { reference: `Practitioner/${performer}` } } : {}),
    };
  }

  if (resourceType === "Observation") {
    return {
      resourceType: "Observation",
      id,
      status: "final",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory" }] }],
      code: codeableConcept,
      subject,
      effectiveDateTime: effectiveDate,
      ...(value !== undefined
        ? { valueQuantity: { value, unit, system: "http://unitsofmeasure.org", code: unit } }
        : {}),
    };
  }

  // Procedure
  return {
    resourceType: "Procedure",
    id,
    status: "completed",
    code: codeableConcept,
    subject,
    performedDateTime: performedDate,
    ...(performer ? { performer: [{ actor: { reference: `Practitioner/${performer}` } }] } : {}),
  };
}

const resource = buildResource();
const newEntry = { resource, request: { method: "PUT", url: `${resourceType}/${id}` } };

// ── 1. Persist to the checked-in bundle file ────────────────────────────────
bundle.entry.push(newEntry);
writeFileSync(bundlePath, JSON.stringify(bundle, null, 2) + "\n");
console.log(`✓ Appended ${resourceType}/${id} to ${bundleFile}`);

// ── 2. POST to the already-running mock FHIR server ─────────────────────────
async function postLive() {
  const base = target === "emr" ? EMR_BASE : PAYER_BASE;
  const transactionBundle = { resourceType: "Bundle", type: "transaction", entry: [newEntry] };

  try {
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/fhir+json", Accept: "application/fhir+json" },
      body: JSON.stringify(transactionBundle),
    });
    if (!res.ok) {
      const body = await res.text();
      console.warn(`⚠ Bundle file updated, but the live POST to ${base} failed (HTTP ${res.status}): ${body}`);
      console.warn(`  The FHIR server may not be running. It'll pick up this resource on the next seed-all.mjs run.`);
      return;
    }
    console.log(`✓ Posted ${resourceType}/${id} live to ${base} — visible in DTR/chart immediately, no restart needed.`);
  } catch (e) {
    console.warn(`⚠ Bundle file updated, but couldn't reach ${base}: ${e.message}`);
    console.warn(`  Start the stack and run seed-all.mjs to pick this resource up, or re-run this script once it's up.`);
  }
}

await postLive();

console.log(`\nSubject: Patient/${patientId}`);
console.log(`Re-evaluate DTR for this patient to see the effect of this addition.`);
