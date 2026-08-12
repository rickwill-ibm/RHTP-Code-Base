/**
 * EDI submission proxy — Next.js API route.
 *
 * Receives the structured PA payload from pasService.ts and forwards it
 * to the EDI Translator microservice (X12 275/278 gateway).
 *
 * No EDI Translator microservice exists in this demo build (no Docker,
 * no clearinghouse credentials) — the FHIR PAS path has a real equivalent
 * in mock-fhir-server, but X12 275/278 generation does not. So both
 * NEXT_PUBLIC_USE_MOCK_DATA=true AND live mode without EDI_GATEWAY_URL set
 * return a stub PA number instead of failing, so the EDI channel is
 * demoable end to end just like the FHIR channel. Once a real gateway URL
 * is configured, live mode forwards to it for a real submission.
 */
import { NextResponse } from "next/server";

function stubResponse() {
  const paNumber = `PA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
  const timestamp = new Date().toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return NextResponse.json({ paNumber, timestamp });
}

export async function POST(request: Request) {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

  if (useMock) {
    return stubResponse();
  }

  // Live path: forward to EDI Translator microservice, if one is configured.
  const ediGatewayUrl = process.env.EDI_GATEWAY_URL;
  if (!ediGatewayUrl) {
    console.warn(
      "[submit-edi] EDI_GATEWAY_URL not set — no EDI Translator microservice exists in this demo build. Returning a stub PA number instead of failing so the X12 275/278 channel stays demoable."
    );
    return stubResponse();
  }

  const body = await request.json();

  const res = await fetch(ediGatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `EDI gateway error: ${res.status}`, detail: text },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
