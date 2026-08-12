import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchPatientBanner } from "@/lib/fhir/patientLookup";
import type { SmartContext } from "@/lib/smart/smartLaunch";

function makeCtx(overrides: Partial<SmartContext> = {}): SmartContext {
  return {
    accessToken: "test-token",
    tokenType: "Bearer",
    fhirBaseUrl: "http://localhost:8080/fhir",
    patientId: "patient-jordan-lee",
    scopes: ["patient/*.read"],
    expiresAt: Date.now() + 60_000,
    ...overrides,
  };
}

describe("fetchPatientBanner (real FHIR lookup, no fabricated fallback)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("derives name/dob/memberId from a real Patient resource", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        resourceType: "Patient",
        id: "patient-jordan-lee",
        name: [{ use: "official", family: "Lee", given: ["Jordan"] }],
        birthDate: "1972-04-11",
        identifier: [
          { type: { coding: [{ code: "MB" }] }, value: "7788990" },
          { type: { coding: [{ code: "MR" }] }, value: "MRN-001" },
        ],
      }),
    });

    const banner = await fetchPatientBanner(makeCtx());

    expect(banner.name).toBe("Jordan Lee");
    expect(banner.dob).toBe("1972-04-11");
    // The first identifier tagged MB/MR/SN (member/medical-record/subscriber) is used.
    expect(banner.memberId).toBe("7788990");

    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://localhost:8080/fhir/Patient/patient-jordan-lee");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
  });

  it("falls back to the first identifier when none is typed MB/MR/SN", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        resourceType: "Patient",
        id: "patient-x",
        name: [{ text: "X Patient" }],
        identifier: [{ value: "untyped-001" }],
      }),
    });

    const banner = await fetchPatientBanner(makeCtx({ patientId: "patient-x" }));
    expect(banner.memberId).toBe("untyped-001");
    expect(banner.dob).toBe("unknown");
  });

  it("throws (does not fabricate a banner) when no patient id is available", async () => {
    await expect(fetchPatientBanner(makeCtx({ patientId: "" }), "")).rejects.toThrow(/No patient id/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("propagates a FhirError instead of returning fake data on HTTP failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "Patient not found",
    });

    await expect(fetchPatientBanner(makeCtx({ patientId: "does-not-exist" }))).rejects.toThrow(/404/);
  });
});
