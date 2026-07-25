/**
 * SMART login (plan F-3): start the authorization-code + PKCE flow at WSO2 IS.
 */
import { NextResponse } from 'next/server';
import { beginSmartLaunch } from '@/lib/server/smartSession';
import { ooError } from '@/lib/fhir/operationOutcome';

export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  try {
    const { authorizeUrl } = await beginSmartLaunch();
    return NextResponse.redirect(authorizeUrl);
  } catch (err) {
    // WSO2 not configured (ENV-3) — surface a clear, non-PHI error.
    return NextResponse.json(
      ooError(err instanceof Error ? err.message : 'login unavailable', 'login'),
      {
        status: 503,
      }
    );
  }
}
