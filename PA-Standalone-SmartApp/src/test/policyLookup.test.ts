import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listPolicies, findPolicyIdForCpt } from "@/lib/dtr/policyLookup";

describe("policyLookup (live query against Policy Engine /policies — no hardcoded CPT map)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("lists policies from the Policy Engine", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        policies: [
          { policyId: "bariatric-surgery-cpt-43644", title: "Bariatric Surgery", payer: "Blue Cross", cptCodes: ["43644", "43645"], criteriaGroups: 3 },
        ],
      }),
    });

    const policies = await listPolicies();
    expect(policies).toHaveLength(1);
    expect(policies[0].cptCodes).toContain("43644");
  });

  it("finds the policy governing a given CPT code from whatever has actually been ingested", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        policies: [
          { policyId: "lumbar-mri-72148", title: "Lumbar MRI", payer: "Blue Cross", cptCodes: ["72148"], criteriaGroups: 2 },
          { policyId: "bariatric-surgery-cpt-43644", title: "Bariatric Surgery", payer: "Blue Cross", cptCodes: ["43644"], criteriaGroups: 3 },
        ],
      }),
    });

    const policyId = await findPolicyIdForCpt("72148");
    expect(policyId).toBe("lumbar-mri-72148");
  });

  it("returns null — not an error — when no ingested policy covers the code yet", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ policies: [] }),
    });

    const policyId = await findPolicyIdForCpt("99999");
    expect(policyId).toBeNull();
  });

  it("throws when the Policy Engine itself is unreachable/errors", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(listPolicies()).rejects.toThrow(/500/);
  });
});
