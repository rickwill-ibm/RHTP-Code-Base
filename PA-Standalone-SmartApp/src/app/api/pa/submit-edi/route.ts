/**
 * EDI submission proxy — Next.js API route.
 *
 * Receives the structured PA payload from pasService.ts and forwards it
 * to the EDI Translator microservice (X12 275/278 gateway).
 *
 * In mock/dev mode returns a fake PA number without contacting the gateway.
 */
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

  if (useMock) {
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

  // Live path: forward to EDI Translator microservice
  const ediGatewayUrl = process.env.EDI_GATEWAY_URL;
  if (!ediGatewayUrl) {
    return NextResponse.json(
      { error: "EDI_GATEWAY_URL is not configured" },
      { status: 503 }
    );
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
