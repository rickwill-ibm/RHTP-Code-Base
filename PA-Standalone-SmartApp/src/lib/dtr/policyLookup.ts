/**
 * Live policy lookup — replaces the static CPT_TO_POLICY_ID map that used to
 * live in dtrService.ts (hardcoded to 3 CPT codes, all pointing at the one
 * seeded bariatric-surgery policy). Queries the Policy Engine's own /policies
 * list — populated by whatever has actually been ingested via POST
 * /ingest/text (Intelligent Policy Engine, LLM extraction) or POST /ingest
 * (seed file) — so a newly-ingested policy is immediately usable by DTR
 * without a code change here.
 */

const POLICY_ENGINE_URL =
  process.env.NEXT_PUBLIC_POLICY_ENGINE_URL ?? "http://localhost:8083";

export interface PolicySummary {
  policyId: string;
  title: string;
  payer: string;
  cptCodes: string[];
  criteriaGroups: number;
  effectiveDate?: string;
}

/** List every policy currently ingested into the Policy Engine. */
export async function listPolicies(): Promise<PolicySummary[]> {
  const res = await fetch(`${POLICY_ENGINE_URL}/policies`);
  if (!res.ok) {
    throw new Error(`Policy Engine /policies returned ${res.status}`);
  }
  const body = (await res.json()) as { policies: PolicySummary[] };
  return body.policies ?? [];
}

/**
 * Find the ingested policy that governs a given CPT code. Returns null (not
 * an error) when no ingested policy covers it — the caller should surface
 * that as "no policy on file for this code" rather than a hard failure, since
 * it's an expected state until more of the corpus is ingested.
 */
export async function findPolicyIdForCpt(cptCode: string): Promise<string | null> {
  const policies = await listPolicies();
  const match = policies.find((p) => p.cptCodes?.includes(cptCode));
  return match?.policyId ?? null;
}
