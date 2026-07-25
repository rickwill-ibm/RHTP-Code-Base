/**
 * SMART login (plan F-3): start the authorization-code + PKCE flow at WSO2 IS.
 * In the integrated offline install (no WSO2 + ALLOW_DEV_MOCK_AUTH=true) this
 * establishes a clearly-labelled local dev session instead, so the app renders
 * real FHIR data from the containerized FHIR server.
 */
import { NextRequest, NextResponse } from 'next/server';
import { beginSmartLaunch, startDevSession } from '@/lib/server/smartSession';
import { ooError } from '@/lib/fhir/operationOutcome';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { authorizeUrl } = await beginSmartLaunch();
    return NextResponse.redirect(authorizeUrl);
  } catch (err) {
    // WSO2 not configured — try the dev-session fallback (offline install).
    const dev = await startDevSession();
    if (dev) return NextResponse.redirect(new URL('/cms', req.nextUrl.origin));
    return NextResponse.json(
      ooError(err instanceof Error ? err.message : 'login unavailable', 'login'),
      {
        status: 503,
      }
    );
  }
}
