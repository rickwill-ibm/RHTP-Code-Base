/**
 * BFF: reviewer work queue (reviewer UI).
 *
 * GET /api/work-queue → work items derived from persisted Evidence Records,
 * grouped by disposition. Authenticated + authorized + audited. Read-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/server/smartSession';
import { ooError } from '@/lib/fhir/operationOutcome';
import { correlationFrom } from '@/lib/server/correlation';
import { canReadMemberData } from '@/lib/authz/guard';
import { audit } from '@/lib/server/audit';
import { flag } from '@/lib/flags/flags';
import { defaultEvidenceStore } from '@/lib/evidence/evidenceStore';
import { listWorkItems, groupByQueue } from '@/lib/goldenThread/workQueueView';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const correlationId = correlationFrom(req.headers);
  if (!flag('goldenThread')) {
    return NextResponse.json(ooError('Work queue not enabled', 'not-supported'), { status: 404 });
  }
  if (!(await isAuthenticated().catch(() => false))) {
    return NextResponse.json(ooError('Not authenticated', 'login'), { status: 401 });
  }
  const decision = canReadMemberData({ role: 'pa-reviewer', purpose: 'operations' });
  if (!decision.allow) {
    return NextResponse.json(ooError(decision.reason, 'forbidden'), { status: 403 });
  }

  try {
    const items = await listWorkItems(defaultEvidenceStore());
    await audit({
      ts: new Date().toISOString(),
      actor: 'session-user',
      action: 'work-queue.list',
      correlationId,
      outcome: 'success',
      detail: `items=${items.length}`,
    });
    return NextResponse.json({ count: items.length, groups: groupByQueue(items) }, { status: 200 });
  } catch {
    return NextResponse.json(ooError('Failed to load work queue', 'exception'), { status: 500 });
  }
}
