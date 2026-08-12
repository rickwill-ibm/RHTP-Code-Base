/**
 * test-runner.mjs — end-to-end test for the Policy Engine.
 *
 * Tests:
 *   1. Ingest the bariatric surgery policy via LLM
 *   2. Evaluate Rachel Green's FHIR record against it
 *   3. Verify expected criteria groups are met/gap
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node src/test-runner.mjs
 *
 * The policy engine must be running (npm run dev) OR this script starts
 * the evaluation inline without the HTTP server.
 */

import { ingestPolicyText, loadPolicy } from "./policy-ingestor.mjs";
import { evaluatePolicy } from "./fhir-evaluator.mjs";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

const EMR_BASE = process.env.EMR_FHIR_BASE ?? "http://localhost:8080/fhir";
const POLICY_ID = "bariatric-surgery-cpt-43644";
const PATIENT_ID = "patient-rachel-green";
const CPT = "43644";
const FORCE_REINGEST = process.argv.includes("--force");

async function run() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  PA Policy Engine — End-to-End Test                          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // ── Step 1: Verify EMR FHIR has Rachel Green ──────────────────────────────
  console.log("Step 1: Verify Rachel Green is in EMR FHIR...");
  try {
    const res = await fetch(`${EMR_BASE}/Patient/${PATIENT_ID}`, {
      headers: { Accept: "application/fhir+json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const patient = await res.json();
    const name = patient.name?.[0];
    console.log(`  ✓ Patient: ${name?.given?.[0]} ${name?.family} | DOB: ${patient.birthDate}`);
  } catch (err) {
    console.error(`  ✗ EMR FHIR unreachable: ${err.message}`);
    console.error("  → Run: docker compose -f PA-Standalone-SmartApp/infra/docker-compose.yml up -d hapi-fhir-payer");
    console.error("  → And: node PA-Standalone-SmartApp/infra/seed/seed-all.mjs");
    process.exit(1);
  }

  // ── Step 2: Ingest policy ─────────────────────────────────────────────────
  console.log("\nStep 2: Ingest bariatric surgery policy...");
  const seedPath = resolve(__dir, "../policies/seeds", `${POLICY_ID}.txt`);
  if (!existsSync(seedPath)) {
    console.error(`  ✗ Seed file not found: ${seedPath}`);
    process.exit(1);
  }

  let policy;
  const cachedPath = resolve(__dir, "../policies", `${POLICY_ID}.json`);
  if (!FORCE_REINGEST && existsSync(cachedPath)) {
    console.log("  → Using cached policy (pass --force to re-extract via LLM)");
    policy = loadPolicy(POLICY_ID);
  } else {
    if (!process.env.OPENAI_API_KEY) {
      console.error("  ✗ OPENAI_API_KEY not set");
      console.error("  → Set it in your .env.local or export it before running this test");
      process.exit(1);
    }
    const policyText = readFileSync(seedPath, "utf-8");
    policy = await ingestPolicyText(policyText, POLICY_ID, FORCE_REINGEST);
  }

  console.log(`  ✓ Policy: ${policy.policyTitle}`);
  console.log(`  ✓ Criteria groups: ${policy.criteriaGroups?.length}`);
  policy.criteriaGroups?.forEach((g) => {
    console.log(`    Group ${g.id}: ${g.title} (required: ${g.required})`);
  });

  // ── Step 3: Evaluate Rachel Green ────────────────────────────────────────
  console.log(`\nStep 3: Evaluate patient ${PATIENT_ID} against ${POLICY_ID}...`);
  const result = await evaluatePolicy(policy, PATIENT_ID, CPT, null);

  console.log(`\n  Policy: ${result.policyTitle}`);
  console.log(`  All Met: ${result.allMet}`);
  console.log(`\n  Criteria Results:`);

  let metCount = 0, gapCount = 0;
  result.groups.forEach((g) => {
    const icon = g.status === "met" ? "✓" : "✗";
    const badge = g.required ? "[REQUIRED]" : "[optional]";
    console.log(`  ${icon} Group ${g.id} ${badge}: ${g.title} → ${g.status.toUpperCase()}`);
    if (g.status === "met" && g.leaf) {
      console.log(`      Evidence: ${g.leaf.code} — ${g.leaf.evidence}`);
    }
    if (g.status === "gap") {
      console.log(`      Gap: ${g.fhirDetail ?? "no data found"}`);
      if (g.candidateCodes?.length) {
        console.log(`      Acceptable codes: ${g.candidateCodes.slice(0, 3).map((c) => c.code).join(", ")}…`);
      }
    }
    if (g.status === "met") metCount++; else gapCount++;
  });

  console.log(`\n  Summary: ${metCount} met, ${gapCount} gap`);
  console.log(`  Overall: ${result.allMet ? "✓ ALL REQUIRED CRITERIA MET — PA can be submitted" : "✗ GAPS REMAIN — documentation upload required"}`);

  // ── Step 4: Validate expected results for Rachel ─────────────────────────
  console.log("\nStep 4: Validate expected results...");
  const primaryObesity = result.groups.find((g) => g.title.toLowerCase().includes("obesity") || g.title.toLowerCase().includes("primary"));
  const bmiGroup = result.groups.find((g) => g.title.toLowerCase().includes("bmi") || g.title.toLowerCase().includes("body mass"));
  const comorbidity = result.groups.find((g) => g.title.toLowerCase().includes("comorbid") || g.title.toLowerCase().includes("qualifying"));

  let passed = 0, failed = 0;
  function check(label, condition) {
    if (condition) { console.log(`  ✓ ${label}`); passed++; }
    else { console.log(`  ✗ FAIL: ${label}`); failed++; }
  }

  check("Primary obesity group found",        !!primaryObesity);
  check("Primary obesity is MET (E66.01 in FHIR)", primaryObesity?.status === "met");
  check("BMI group found",                    !!bmiGroup);
  check("BMI is MET (37.1 >= 35 in FHIR)",   bmiGroup?.status === "met");
  check("Comorbidity group found",            !!comorbidity);
  check("Comorbidity is GAP (no comorbidity seeded)", comorbidity?.status === "gap");

  console.log(`\n  Test result: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error("\n✗ Test failures detected");
    process.exit(1);
  } else {
    console.log("\n✓ All tests passed");
    console.log("\nThe DTR flow for Rachel Green works end-to-end:");
    console.log("  • EMR FHIR → E66.01 obesity ✓, BMI 37.1 ✓");
    console.log("  • GAP → qualifying comorbidity (no G47.33/I10/E11 seeded)");
    console.log("  • This triggers the CDex upload flow in the PA app");
  }
}

run().catch((err) => {
  console.error("\n✗ Fatal:", err.message);
  process.exit(1);
});
