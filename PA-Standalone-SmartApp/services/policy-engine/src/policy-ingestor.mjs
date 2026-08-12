/**
 * policy-ingestor.mjs
 *
 * Reads a medical policy document (plain text or extracted PDF text) and uses
 * an LLM to extract structured criteria into our normalized PolicyDefinition
 * shape.
 *
 * The extracted policy is cached in memory and optionally persisted to
 * policies/<policyId>.json so re-ingestion is free on restart.
 *
 * This is the "intelligent" layer — the LLM reads the actual policy language
 * and produces machine-executable FHIR criteria rules.
 *
 * ── LLM provider ────────────────────────────────────────────────────────
 * Prefers OpenAI (gpt-4o) if OPENAI_API_KEY is set. Falls back to Groq — a
 * genuinely free, no-credit-card LLM provider — if GROQ_API_KEY is set
 * instead. Groq's API is OpenAI-compatible, so the same `openai` SDK works
 * unmodified, just pointed at Groq's baseURL with a Groq key and model.
 * This exists so the demo can run real LLM extraction (not a fabricated or
 * rule-based stand-in) without requiring OpenAI billing/procurement to be
 * set up first. Get a free key at https://console.groq.com/keys.
 */

import OpenAI from "openai";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { DEFAULT_REVIEW_CADENCE_DAYS } from "./policy-review.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const POLICIES_DIR = resolve(__dir, "../policies");

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

/** Which LLM provider is available right now, and its config — OpenAI takes
 * priority if both are set. Returns null if neither key is configured. */
export function resolveProvider() {
  if (process.env.OPENAI_API_KEY) {
    return { provider: "openai", apiKey: process.env.OPENAI_API_KEY, baseURL: undefined, model: OPENAI_MODEL };
  }
  if (process.env.GROQ_API_KEY) {
    return { provider: "groq", apiKey: process.env.GROQ_API_KEY, baseURL: GROQ_BASE_URL, model: GROQ_MODEL };
  }
  return null;
}

// Lazily constructed — an SDK client throws at construction time if no key
// is configured, which used to crash the entire process on startup
// (including /evaluate, /policies, /health — none of which need an LLM at
// all). Only build the client when an actual ingestion call needs it. Also
// rebuilds if the active provider changes between calls (e.g. a key was
// added after the process started).
let _client = null;
let _clientProvider = null;
function getClient() {
  const resolved = resolveProvider();
  if (!resolved) {
    throw new Error(
      "No LLM provider configured — set OPENAI_API_KEY, or GROQ_API_KEY for a free, no-credit-card option " +
        "(get one at https://console.groq.com/keys) — to run policy extraction"
    );
  }
  if (!_client || _clientProvider !== resolved.provider) {
    _client = new OpenAI({ apiKey: resolved.apiKey, baseURL: resolved.baseURL });
    _clientProvider = resolved.provider;
  }
  return { client: _client, ...resolved };
}

// ── Normalized Policy Definition ─────────────────────────────────────────────

/**
 * A PolicyCriterionGroup maps to one DTR group card in the UI:
 *   - id: unique group number
 *   - title: human-readable group name (e.g. "Primary Obesity Diagnosis")
 *   - required: true = must be met; false = nice-to-have
 *   - fhirQuery: how to check this criterion against FHIR
 *   - candidateCodes: ICD-10/CPT codes that satisfy this criterion
 *   - documentationRequired: what clinical docs must be uploaded if not met
 */
export const EXTRACTION_PROMPT = `
You are a medical policy analyst for a health insurance prior authorization system.

Extract structured criteria from the medical policy text below.
Return ONLY valid JSON matching this exact schema — no markdown, no explanation:

{
  "policyTitle": "string — full official title of the policy",
  "policyId": "string — kebab-case id derived from title",
  "effectiveDate": "string — YYYY-MM-DD or null",
  "payer": "string — payer name",
  "governedCptCodes": ["array of CPT codes this policy governs"],
  "paRequired": true,
  "criteriaGroups": [
    {
      "id": 1,
      "title": "string — criterion group name",
      "required": true,
      "description": "string — plain English description of this criterion",
      "fhirQuery": {
        "resourceType": "string — FHIR resource type to query (Condition|Observation|MedicationRequest|Procedure)",
        "searchParam": "string — FHIR search parameter name (e.g. 'code')",
        "system": "string — terminology system URI",
        "codes": ["array of codes that satisfy this criterion"],
        "valueComparison": null
      },
      "candidateCodes": [
        { "code": "string", "system": "string — full URI", "display": "string" }
      ],
      "documentationRequired": "string — what to upload if criterion cannot be auto-satisfied from FHIR",
      "sourceExcerpt": "string — the exact sentence(s) from the source text below, quoted verbatim, that this criterion group was derived from. This is what a human reviewer uses to verify the extraction against the original document, so it must be a real, findable quote — not a paraphrase."
    }
  ],
  "notes": "string — any important coverage notes or exclusions"
}

Rules:
- criteriaGroups must be exhaustive — every clinical requirement becomes a group
- fhirQuery.codes must be real ICD-10-CM, LOINC, or CPT codes
- For BMI criteria: use LOINC 39156-5 (BMI Observation), include valueComparison like ">= 35"
- For diagnosis criteria: use ICD-10-CM system "http://hl7.org/fhir/sid/icd-10-cm"
- For lab/vital criteria: use LOINC system "http://loinc.org"
- required=false groups are supportive but not mandatory for approval
- sourceExcerpt must be a verbatim quote from the policy text, not a summary — a clinical reviewer will use it to trace each group back to the original document

Medical policy text:
`;

/**
 * ingestPolicyText — send policy text to OpenAI, get back structured criteria.
 * Caches to policies/<policyId>.json.
 *
 * Every fresh extraction (not a cache hit) starts life with
 * status: "pending_review" — it is NOT usable by DTR (GET /policies filters
 * to status:"approved" only) until a clinical reviewer explicitly approves
 * it. See policy-review.mjs for the review/approve/reject workflow and the
 * staleness/re-review mechanism built on top of it.
 *
 * @param {string} policyText
 * @param {string} policyId
 * @param {boolean} force
 * @param {{ sourceFile?: string | null }} opts — sourceFile is the filename
 *   (relative to policies/seeds/) this text was read from, if any — used for
 *   the source-file-changed staleness check. null for pasted-text ingestion.
 */
export async function ingestPolicyText(policyText, policyId, force = false, opts = {}) {
  const { sourceFile = null } = opts;
  if (!existsSync(POLICIES_DIR)) mkdirSync(POLICIES_DIR, { recursive: true });
  const cachePath = resolve(POLICIES_DIR, `${policyId}.json`);

  // Return cached version unless forced re-extraction — a cache hit is not a
  // new extraction event, so it does NOT touch review status/history.
  if (!force && existsSync(cachePath)) {
    console.log(`[PolicyIngestor] Cache hit for ${policyId}`);
    return JSON.parse(readFileSync(cachePath, "utf-8"));
  }

  const { client, provider, model } = getClient(); // throws a clear error if neither OPENAI_API_KEY nor GROQ_API_KEY is set

  console.log(`[PolicyIngestor] Extracting policy ${policyId} via ${provider === "openai" ? "OpenAI" : "Groq"} (${model})…`);

  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: EXTRACTION_PROMPT + policyText,
      },
    ],
  });

  const raw = response.choices[0].message.content;
  const extracted = JSON.parse(raw);

  // A re-extraction (force=true on an existing policyId) is a genuinely new
  // version of the extraction and resets the HITL gate — a corrected policy
  // needs re-approval, it does not inherit the prior approval or its due date.
  const policy = {
    ...extracted,
    status: "pending_review",
    sourcePolicyText: policyText,
    sourceFile,
    lastApprovedSourceMtime: null,
    reviewCadenceDays: DEFAULT_REVIEW_CADENCE_DAYS,
    reviewHistory: [],
    // Which LLM actually produced this extraction — shown to reviewers so
    // they can weigh a Groq/Llama extraction's quality differently from a
    // GPT-4o one if it matters for their review.
    extractionProvider: provider,
    extractionModel: model,
  };

  // Persist to cache
  writeFileSync(cachePath, JSON.stringify(policy, null, 2), "utf-8");
  console.log(`[PolicyIngestor] Extracted and cached: ${cachePath}`);
  console.log(`[PolicyIngestor] Criteria groups: ${policy.criteriaGroups?.length}`);
  console.log(`[PolicyIngestor] Status: pending_review — needs clinical review/approval before DTR can use it`);

  return policy;
}

/**
 * loadPolicy — load from cache or throw if not yet ingested.
 */
export function loadPolicy(policyId) {
  const cachePath = resolve(POLICIES_DIR, `${policyId}.json`);
  if (!existsSync(cachePath)) {
    throw new Error(`Policy ${policyId} not ingested yet. POST /ingest first.`);
  }
  return JSON.parse(readFileSync(cachePath, "utf-8"));
}

/**
 * listPolicies — list all cached policies.
 */
export function listPolicies() {
  if (!existsSync(POLICIES_DIR)) return [];
  return readdirSync(POLICIES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        const p = JSON.parse(readFileSync(resolve(POLICIES_DIR, f), "utf-8"));
        return { policyId: p.policyId, title: p.policyTitle, payer: p.payer, groups: p.criteriaGroups?.length ?? 0 };
      } catch { return null; }
    })
    .filter(Boolean);
}
