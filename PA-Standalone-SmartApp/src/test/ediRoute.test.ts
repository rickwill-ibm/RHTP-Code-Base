import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// Smoke test for the EDI API route
describe("EDI submit API route (mock mode)", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_USE_MOCK_DATA = "true";
  });

  it("returns a PA number and timestamp in mock mode", async () => {
    const { POST } = await import("@/app/api/pa/submit-edi/route");

    const req = new NextRequest("http://localhost:4030/api/pa/submit-edi", {
      method: "POST",
      body: JSON.stringify({ order: {}, patient: {}, crd: {}, dtr: {} }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.paNumber).toMatch(/^PA-\d{4}-\d{5}$/);
    expect(typeof json.timestamp).toBe("string");
  });
});
