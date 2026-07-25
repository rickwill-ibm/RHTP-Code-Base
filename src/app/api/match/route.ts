/**
 * BFF: $member-match — plan Slice 2 (Provider Access) / Slice 3 (P2P).
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/server/smartSession';
import { memberMatch } from '@/lib/server/memberMatch';
import { correlationFrom } from '@/lib/server/correlation';
import { ooError } from '@/lib/fhir/operationOutcome';
import { devMockEnabled, devMemberMatch } from '@/lib/server/devStubs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const correlationId = correlationFrom(req.headers);
  if (!(await isAuthenticated().catch(() => false))) {
    return NextResponse.json(ooError('Not authenticated', 'login'), { status: 401 });
  }
  if (devMockEnabled()) {
    return NextResponse.json(devMemberMatch());
  }
  const parameters = await req.json().catch(() => null);
  if (!parameters) {
    return NextResponse.json(ooError('Parameters body required', 'required'), { status: 400 });
  }
  const result = await memberMatch(parameters, { actor: 'session-user', correlationId });
  return NextResponse.json(
    result.ok ? result.result : ooError('member-match failed', 'processing'),
    {
      status: result.ok ? 200 : result.status || 502,
    }
  );
}
