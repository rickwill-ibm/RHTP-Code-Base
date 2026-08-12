/**
 * BFF: fetch a persisted Evidence Record (increment #1; hardened).
 *
 * GET /api/evidence/:id → the stored Evidence Record (auditable Coverage
 * Determination Record). Authenticated + authorized + id-validated + audited.
 * Read-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/server/smartSession';
import { ooError } from '@/lib/fhir/operationOutcome';
import { correlationFrom } from '@/lib/server/correlation';
import { canReadMemberData } from '@/lib/authz/guard';
import { audit } from '@/lib/server/audit';
import { defaultEvidenceStore } from '@/lib/evidence/evidenceStore';
import { validateEvidenceId } from '@/lib/goldenThread/validate';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const correlationId = correlationFrom(req.headers);
  if (!(await isAuthenticated().catch(() => false))) {
    return NextResponse.json(ooError('Not authenticated', 'login'), { status: 401 });
  }

  const { id } = await params;
  const v = validateEvidenceId(id);
  if (!v.ok) {
    return NextResponse.json(ooError(v.error ?? 'invalid id', 'invalid'), { status: 400 });
  }

  const decision = canReadMemberData({ role: 'pa-reviewer', purpose: 'operations' });
  if (!decision.allow) {
    return NextResponse.json(ooError(decision.reason, 'forbidden'), { status: 403 });
  }

  try {
    const record = await defaultEvidenceStore().get(id);
    if (!record) {
      return NextResponse.json(ooError(`Evidence record ${id} not found`, 'not-found'), {
        status: 404,
      });
    }
    await audit({
      ts: new Date().toISOString(),
      actor: 'session-user',
      action: 'evidence.read',
      resourceRef: `Evidence/${id}`,
      correlationId,
      outcome: 'success',
    });
    return NextResponse.json(record, { status: 200 });
  } catch {
    return NextResponse.json(ooError('Failed to read evidence record', 'exception'), {
      status: 500,
    });
  }
}
