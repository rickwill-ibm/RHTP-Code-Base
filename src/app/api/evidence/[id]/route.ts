/**
 * BFF: fetch a persisted Evidence Record (increment #1).
 *
 * GET /api/evidence/:id → the stored Evidence Record (auditable Coverage
 * Determination Record). Guarded by auth. Read-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/server/smartSession';
import { ooError } from '@/lib/fhir/operationOutcome';
import { defaultEvidenceStore } from '@/lib/evidence/evidenceStore';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  if (!(await isAuthenticated().catch(() => false))) {
    return NextResponse.json(ooError('Not authenticated', 'login'), { status: 401 });
  }
  const { id } = await params;
  const record = await defaultEvidenceStore().get(id);
  if (!record) {
    return NextResponse.json(ooError(`Evidence record ${id} not found`, 'not-found'), {
      status: 404,
    });
  }
  return NextResponse.json(record, { status: 200 });
}
