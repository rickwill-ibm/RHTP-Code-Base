#!/usr/bin/env node
/**
 * generate-patient.mjs — scaffolds a new synthetic test patient (EMR + payer
 * FHIR transaction bundles) in the same shape as the existing Rachel Green
 * seed, so a new test case doesn't require hand-writing FHIR JSON.
 *
 * Writes <slug>-emr.bundle.json and <slug>-payer.bundle.json into this
 * directory. seed-all.mjs auto-discovers every *-emr.bundle.json /
 * *-payer.bundle.json pair here — no code change needed to seed a newly
 * generated patient, and no more "Rachel Green is the only test patient."
 *
 * Usage:
 *   node generate-patient.mjs \
 *     --slug jordan-lee \
 *     --given Jordan --family Lee --dob 1972-04-11 --gender male \
 *     --member-id 7788990 \
 *     --condition-code M17.11 --condition-text "Unilateral primary osteoarthritis, right knee" \
 *     --cpt 27447 --cpt-desc "Total knee arthroplasty" \
 *     [--bmi 34.2] [--force]
 *
 * Only --slug, --given, --family, --dob, --member-id, --condition-code,
 * --condition-text, --cpt, --cpt-desc are required. Run with no args for
 * a usage summary.
 */

import { writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

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

const REQUIRED = [
  "slug", "given", "family", "dob", "member-id",
  "condition-code", "condition-text", "cpt", "cpt-desc",
];

function printUsageAndExit() {
  console.log(`
generate-patient.mjs — scaffold a new synthetic test patient's FHIR seed bundles

Required:
  --slug            URL-safe id fragment, e.g. jordan-lee
  --given           First name
  --family          Last name
  --dob             YYYY-MM-DD
  --member-id       Payer member/subscriber id (digits)
  --condition-code  ICD-10-CM code supporting the ordered procedure
  --condition-text  Human-readable condition text
  --cpt             CPT/HCPCS code for the procedure being ordered
  --cpt-desc        Procedure description

Optional:
  --gender          male | female | other | unknown  (default: unknown)
  --bmi             Adds a BMI Observation (kg/m2), e.g. 34.2
  --provider-name   Ordering provider display name (default: Dr. Jacob P. Aagaard MD)
  --provider-npi    Ordering provider NPI (default: 1234567890)
  --org-name        Facility organization name (default: Metro General Surgical Associates)
  --payer-name      Payer organization name (default: Blue Cross Prior Authorization)
  --force           Overwrite existing bundle files for this slug

Example:
  node generate-patient.mjs --slug jordan-lee --given Jordan --family Lee \\
    --dob 1972-04-11 --gender male --member-id 7788990 \\
    --condition-code M17.11 --condition-text "Unilateral primary osteoarthritis, right knee" \\
    --cpt 27447 --cpt-desc "Total knee arthroplasty" --bmi 34.2
`);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
if (Object.keys(args).length === 0) printUsageAndExit();

const missing = REQUIRED.filter((k) => !args[k]);
if (missing.length > 0) {
  console.error(`Missing required argument(s): ${missing.map((m) => `--${m}`).join(", ")}\n`);
  printUsageAndExit();
}

const slug = String(args.slug).trim();
const given = String(args.given).trim();
const family = String(args.family).trim();
const dob = String(args.dob).trim();
const gender = String(args.gender ?? "unknown").trim();
const memberId = String(args["member-id"]).trim();
const conditionCode = String(args["condition-code"]).trim();
const conditionText = String(args["condition-text"]).trim();
const cpt = String(args.cpt).trim();
const cptDesc = String(args["cpt-desc"]).trim();
const bmi = args.bmi ? Number(args.bmi) : null;
const providerName = String(args["provider-name"] ?? "Dr. Jacob P. Aagaard MD");
const providerNpi = String(args["provider-npi"] ?? "1234567890");
const orgName = String(args["org-name"] ?? "Metro General Surgical Associates");
const payerName = String(args["payer-name"] ?? "Blue Cross Prior Authorization");
const force = args.force === true;

if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error(`--slug must be lowercase, digits, and hyphens only (got "${slug}")`);
  process.exit(1);
}

const emrPath = resolve(__dir, `${slug}-emr.bundle.json`);
const payerPath = resolve(__dir, `${slug}-payer.bundle.json`);
if (!force && (existsSync(emrPath) || existsSync(payerPath))) {
  console.error(`Bundle files already exist for slug "${slug}". Pass --force to overwrite.`);
  process.exit(1);
}

const patientId = `patient-${slug}`;
const patientPayerId = `patient-${slug}-payer`;
const practitionerId = `practitioner-${slug}`;
const orgId = `org-${slug}-facility`;
const payerOrgId = `org-${slug}-payer`;
const encounterId = `encounter-${slug}-current`;
const conditionId = `condition-${slug}-primary`;
const bmiConditionId = `condition-${slug}-bmi`;
const coverageId = `coverage-${slug}-001`;
const coveragePayerId = `coverage-${slug}-payer-001`;
const srId = `sr-${slug}-001`;
const today = new Date().toISOString().slice(0, 10);

// ── EMR bundle ─────────────────────────────────────────────────────────────

const emrEntries = [
  {
    resource: {
      resourceType: "Patient",
      id: patientId,
      identifier: [
        { type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code: "MR" }], text: "MRN" }, system: "urn:rhtp:mrn", value: `${slug.toUpperCase()}-${memberId}` },
        { type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code: "MB" }], text: "Member ID" }, system: "urn:rhtp:member", value: memberId },
      ],
      name: [{ use: "official", family, given: [given] }],
      gender,
      birthDate: dob,
    },
    request: { method: "PUT", url: `Patient/${patientId}` },
  },
  {
    resource: {
      resourceType: "Practitioner",
      id: practitionerId,
      identifier: [{ system: "http://hl7.org/fhir/sid/us-npi", value: providerNpi }],
      name: [{ use: "official", family: providerName.split(" ").slice(-2, -1)[0] ?? providerName, given: [providerName] }],
    },
    request: { method: "PUT", url: `Practitioner/${practitionerId}` },
  },
  {
    resource: {
      resourceType: "Organization",
      id: orgId,
      name: orgName,
      type: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/organization-type", code: "prov" }] }],
    },
    request: { method: "PUT", url: `Organization/${orgId}` },
  },
  {
    resource: {
      resourceType: "Organization",
      id: `${payerOrgId}-emr`,
      name: payerName,
      type: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/organization-type", code: "ins" }] }],
    },
    request: { method: "PUT", url: `Organization/${payerOrgId}-emr` },
  },
  {
    resource: {
      resourceType: "Coverage",
      id: coverageId,
      status: "active",
      subscriber: { reference: `Patient/${patientId}` },
      subscriberId: memberId,
      beneficiary: { reference: `Patient/${patientId}` },
      relationship: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/subscriber-relationship", code: "self" }] },
      period: { start: "2024-01-01", end: "2026-12-31" },
      payor: [{ reference: `Organization/${payerOrgId}-emr`, display: payerName }],
      network: `In-Network ${payerName}`,
    },
    request: { method: "PUT", url: `Coverage/${coverageId}` },
  },
  {
    resource: {
      resourceType: "Encounter",
      id: encounterId,
      status: "in-progress",
      class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "AMB", display: "ambulatory" },
      type: [{ coding: [{ system: "http://snomed.info/sct", code: "11429006", display: "Consultation" }] }],
      subject: { reference: `Patient/${patientId}`, display: `${given} ${family}` },
      participant: [{ individual: { reference: `Practitioner/${practitionerId}`, display: providerName } }],
      period: { start: today },
      serviceProvider: { reference: `Organization/${orgId}` },
    },
    request: { method: "PUT", url: `Encounter/${encounterId}` },
  },
  {
    resource: {
      resourceType: "Condition",
      id: conditionId,
      clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
      verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed" }] },
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "problem-list-item" }] }],
      code: { coding: [{ system: "http://hl7.org/fhir/sid/icd-10-cm", code: conditionCode, display: conditionText }], text: conditionText },
      subject: { reference: `Patient/${patientId}` },
      onsetDateTime: today,
      recordedDate: today,
      recorder: { reference: `Practitioner/${practitionerId}` },
    },
    request: { method: "PUT", url: `Condition/${conditionId}` },
  },
  {
    resource: {
      resourceType: "ServiceRequest",
      id: srId,
      status: "draft",
      intent: "order",
      category: [{ coding: [{ system: "http://snomed.info/sct", code: "387713003", display: "Surgical procedure" }] }],
      code: { coding: [{ system: "http://www.ama-assn.org/go/cpt", code: cpt, display: cptDesc }], text: cptDesc },
      subject: { reference: `Patient/${patientId}`, display: `${given} ${family}` },
      encounter: { reference: `Encounter/${encounterId}` },
      requester: { reference: `Practitioner/${practitionerId}`, display: providerName },
      performer: [{ reference: `Organization/${orgId}` }],
      authoredOn: today,
      insurance: [{ reference: `Coverage/${coverageId}` }],
      note: [{ text: `Synthetic test order generated for CPT ${cpt}.` }],
    },
    request: { method: "PUT", url: `ServiceRequest/${srId}` },
  },
];

if (bmi !== null && !Number.isNaN(bmi)) {
  emrEntries.push({
    resource: {
      resourceType: "Condition",
      id: bmiConditionId,
      clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
      verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed" }] },
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "problem-list-item" }] }],
      code: { coding: [{ system: "http://hl7.org/fhir/sid/icd-10-cm", code: `Z68.${Math.floor(bmi)}`, display: `Body mass index [BMI] ${bmi}, adult` }], text: `BMI ${bmi}, adult` },
      subject: { reference: `Patient/${patientId}` },
      onsetDateTime: today,
      recordedDate: today,
    },
    request: { method: "PUT", url: `Condition/${bmiConditionId}` },
  });
  emrEntries.push({
    resource: {
      resourceType: "Observation",
      id: `obs-${slug}-bmi`,
      status: "final",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs" }] }],
      code: { coding: [{ system: "http://loinc.org", code: "39156-5", display: "Body mass index (BMI) [Ratio]" }], text: "BMI" },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      effectiveDateTime: today,
      valueQuantity: { value: bmi, unit: "kg/m2", system: "http://unitsofmeasure.org", code: "kg/m2" },
    },
    request: { method: "PUT", url: `Observation/obs-${slug}-bmi` },
  });
}

const emrBundle = {
  resourceType: "Bundle",
  id: `${slug}-emr-seed`,
  type: "transaction",
  entry: emrEntries,
};

// ── Payer bundle ───────────────────────────────────────────────────────────

const payerBundle = {
  resourceType: "Bundle",
  id: `${slug}-payer-seed`,
  type: "transaction",
  entry: [
    {
      resource: {
        resourceType: "Patient",
        id: patientPayerId,
        identifier: [{ type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code: "MB" }], text: "Member ID" }, system: `urn:${slug}-payer:member`, value: memberId }],
        name: [{ use: "official", family, given: [given] }],
        gender,
        birthDate: dob,
      },
      request: { method: "PUT", url: `Patient/${patientPayerId}` },
    },
    {
      resource: {
        resourceType: "Organization",
        id: payerOrgId,
        name: payerName,
        type: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/organization-type", code: "ins" }] }],
      },
      request: { method: "PUT", url: `Organization/${payerOrgId}` },
    },
    {
      resource: {
        resourceType: "Coverage",
        id: coveragePayerId,
        status: "active",
        subscriber: { reference: `Patient/${patientPayerId}` },
        subscriberId: memberId,
        beneficiary: { reference: `Patient/${patientPayerId}` },
        relationship: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/subscriber-relationship", code: "self" }] },
        period: { start: "2024-01-01", end: "2026-12-31" },
        payor: [{ reference: `Organization/${payerOrgId}` }],
        network: `In-Network ${payerName}`,
      },
      request: { method: "PUT", url: `Coverage/${coveragePayerId}` },
    },
  ],
};

writeFileSync(emrPath, JSON.stringify(emrBundle, null, 2) + "\n");
writeFileSync(payerPath, JSON.stringify(payerBundle, null, 2) + "\n");

console.log(`✓ Wrote ${emrPath}`);
console.log(`✓ Wrote ${payerPath}`);
console.log(`\nPatient ID (use this in the SmartApp's "Load Patient" field): ${patientId}`);
console.log(`\nSeed it with:`);
console.log(`  node ${resolve(__dir, "seed-all.mjs")}`);
console.log(`\n(seed-all.mjs auto-discovers every *-emr.bundle.json / *-payer.bundle.json pair in this directory — no code change needed.)`);
