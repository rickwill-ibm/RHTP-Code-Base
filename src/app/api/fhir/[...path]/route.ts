/**
 * BFF FHIR passthrough (plan F-4).
 *
 * Browser → /api/fhir/<FHIR path> → (session authz) → fhirServer → APIM gateway.
 * No token or gateway URL is ever exposed to the browser. Every call is audited
 * and carries a correlation id.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/server/smartSession';
import { fhirRead, fhirCreate } from '@/lib/server/fhirServer';
import { correlationFrom, CORRELATION_HEADER } from '@/lib/server/correlation';
import { ooError } from '@/lib/fhir/operationOutcome';

export const runtime = 'nodejs';

async function ensureSession(): Promise<boolean> {
  try {
    return await isAuthenticated();
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const correlationId = correlationFrom(req.headers);
  if (!(await ensureSession())) {
    return NextResponse.json(ooError('Not authenticated', 'login'), {
      status: 401,
      headers: { [CORRELATION_HEADER]: correlationId },
    });
  }
  const { path } = await ctx.params;
  const search = req.nextUrl.search; // preserve query string
  const fhirPath = path.join('/') + search;
  const result = await fhirRead(fhirPath, { actor: 'session-user', correlationId });
  return NextResponse.json(result.ok ? result.raw : result.error, {
    status: result.status || (result.ok ? 200 : 502),
    headers: { [CORRELATION_HEADER]: result.correlationId },
  });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const correlationId = correlationFrom(req.headers);
  if (!(await ensureSession())) {
    return NextResponse.json(ooError('Not authenticated', 'login'), {
      status: 401,
      headers: { [CORRELATION_HEADER]: correlationId },
    });
  }
  const { path } = await ctx.params;
  const type = path[0];
  const body = await req.json().catch(() => null);
  const result = await fhirCreate(type, body, { actor: 'session-user', correlationId });
  return NextResponse.json(result.ok ? result.raw : result.error, {
    status: result.status || (result.ok ? 201 : 502),
    headers: { [CORRELATION_HEADER]: result.correlationId },
  });
}
