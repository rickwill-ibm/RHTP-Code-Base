/**
 * SMART callback (plan F-3): exchange the code for tokens, set the encrypted
 * server session, then return the user to the app.
 */
import { NextRequest, NextResponse } from 'next/server';
import { completeSmartCallback } from '@/lib/server/smartSession';
import { audit } from '@/lib/server/audit';
import { correlationFrom } from '@/lib/server/correlation';
import { ooError } from '@/lib/fhir/operationOutcome';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const correlationId = correlationFrom(req.headers);
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  if (!code || !state) {
    return NextResponse.json(ooError('Missing code/state', 'invalid'), { status: 400 });
  }
  try {
    await completeSmartCallback(code, state);
    await audit({
      ts: new Date().toISOString(),
      actor: 'session-user',
      action: 'auth.login',
      correlationId,
      outcome: 'success',
    });
    const dest = new URL('/md-smart-launch', req.nextUrl.origin);
    return NextResponse.redirect(dest);
  } catch (err) {
    await audit({
      ts: new Date().toISOString(),
      actor: 'unknown',
      action: 'auth.login',
      correlationId,
      outcome: 'failure',
      detail: 'callback error',
    });
    return NextResponse.json(
      ooError(err instanceof Error ? err.message : 'auth failed', 'security'),
      { status: 401 }
    );
  }
}
