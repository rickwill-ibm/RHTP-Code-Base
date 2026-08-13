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
  const parameters = await req.json().catch(() => null);
  if (devMockEnabled()) {
    // Extract patientId from the Parameters body to return the right patient's identity
    const pid = (() => {
      try {
        const params = parameters as { parameter?: { name?: string; resource?: { id?: string } }[] };
        return params?.parameter?.find((p) => p.name === 'MemberPatient')?.resource?.id ?? undefined;
      } catch { return undefined; }
    })();
    return NextResponse.json(devMemberMatch(pid));
  }
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
