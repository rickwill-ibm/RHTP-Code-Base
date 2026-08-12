/**
 * Client for the Policy Engine's real ingestion endpoints — no local
 * parsing, no fabricated extraction. Raw policy text is POSTed to the
 * service, which runs it through a real LLM extraction call — OpenAI
 * GPT-4o if OPENAI_API_KEY is set, otherwise Groq (free, no credit card) if
 * GROQ_API_KEY is set — (see services/policy-engine/src/policy-ingestor.mjs)
 * and returns the normalized PolicyDefinition it produced.
 */

const POLICY_ENGINE_URL =
  process.env.NEXT_PUBLIC_POLICY_ENGINE_URL ?? "http://localhost:8083";

export interface IngestPolicyResult {
  success: boolean;
  policyId: string;
  criteriaGroups: number;
}

export interface PolicyDefinition {
  policyId: string;
  policyTitle: string;
  payer?: string;
  effectiveDate?: string;
  governedCptCodes: string[];
  criteriaGroups: {
    id: number;
    title: string;
    fhirQuery?: string;
    candidateCodes?: { code: string; label: string }[];
    documentationRequired?: string;
  }[];
  /** Present on GET /policies/:policyId responses — the HITL review gate
   * status. Optional here since older call sites don't need it; see
   * src/lib/dtr/policyReview.ts for the full typed shape. */
  status?: "pending_review" | "approved" | "needs_revision";
  /** Which LLM actually produced this extraction — "openai" (GPT-4o) or
   * "groq" (a free, no-credit-card alternative — see policy-ingestor.mjs). */
  extractionProvider?: "openai" | "groq";
  extractionModel?: string;
}

/**
 * Ingest raw policy text through the Intelligent Policy Engine. The engine
 * parses the rules with a real LLM call and caches the resulting
 * PolicyDefinition to policies/<policyId>.json — from that point on it's
 * immediately usable by DTR (see policyLookup.findPolicyIdForCpt).
 */
export async function ingestPolicyText(
  policyId: string,
  policyText: string,
  force = false
): Promise<IngestPolicyResult> {
  const res = await fetch(`${POLICY_ENGINE_URL}/ingest/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ policyId, policyText, force }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error ?? `Policy ingestion failed: ${res.status}`);
  }
  return body as IngestPolicyResult;
}

/** Fetch the full parsed PolicyDefinition — used to show what the engine extracted. */
export async function fetchPolicyDefinition(policyId: string): Promise<PolicyDefinition> {
  const res = await fetch(`${POLICY_ENGINE_URL}/policies/${encodeURIComponent(policyId)}`);
  if (!res.ok) {
    throw new Error(`Policy ${policyId} not found (${res.status})`);
  }
  return (await res.json()) as PolicyDefinition;
}

/**
 * A raw policy document sitting in the engine's policies/seeds/ directory on
 * disk, not yet (or already) ingested. Lets the Ingest Policy screen offer a
 * "pick from directory" flow instead of only pasting text by hand.
 */
export interface SeedPolicySummary {
  seedFile: string;
  sourceType: "txt" | "pdf";
  suggestedPolicyId: string | null;
  title: string;
  payer?: string;
  cptCodes?: string;
  sizeBytes: number;
  preview: string;
  alreadyIngested: boolean;
  /** Set if the file couldn't be read/extracted (e.g. a scanned PDF with no text layer). */
  extractError?: string;
}

/** List the real .txt policy documents sitting in policies/seeds/ on the Policy Engine's disk. */
export async function listSeedPolicies(): Promise<SeedPolicySummary[]> {
  const res = await fetch(`${POLICY_ENGINE_URL}/ingest/seeds`);
  if (!res.ok) {
    throw new Error(`Failed to list seed policies (${res.status})`);
  }
  const body = await res.json();
  return (body.seeds ?? []) as SeedPolicySummary[];
}

/**
 * Ingest a policy directly from a file already sitting in policies/seeds/ —
 * the engine reads the file itself and runs the same real LLM extraction
 * pass as ingestPolicyText, just skipping the copy/paste step.
 */
export async function ingestSeedPolicy(
  seedFile: string,
  policyId: string,
  force = false
): Promise<IngestPolicyResult> {
  const res = await fetch(`${POLICY_ENGINE_URL}/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ policyId, seedFile, force }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error ?? `Seed ingestion failed: ${res.status}`);
  }
  return body as IngestPolicyResult;
}

export interface UploadPolicyResult extends IngestPolicyResult {
  savedAs: string;
}

/**
 * Upload a .pdf or .txt policy file directly (e.g. a file already on the
 * user's Desktop) — the engine extracts the real text (PDF text-layer
 * extraction, no OCR), saves a copy into policies/seeds/ so it shows up in
 * the directory next time, and runs the same real LLM extraction pass.
 */
export async function uploadPolicyFile(
  file: File,
  policyId: string,
  force = false
): Promise<UploadPolicyResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("policyId", policyId);
  formData.append("force", String(force));

  const res = await fetch(`${POLICY_ENGINE_URL}/ingest/upload`, {
    method: "POST",
    body: formData,
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error ?? `Upload ingestion failed: ${res.status}`);
  }
  return body as UploadPolicyResult;
}
