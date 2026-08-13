/**
 * BFF: fetch a persisted Evidence Record (increment #1; hardened).
 *
 * GET /api/evidence/:id → the stored Evidence Record (auditable Coverage
 * Determination Record). Authenticated + authorized + id-validated + audited.
 * Read-only.
 *
 * In mock mode a seeded record is returned for any valid evidence ID so the
 * API Explorer can demonstrate the CDex audit spine without needing a prior
 * financial-clearance run to populate the in-memory store.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/server/smartSession';
import { ooError } from '@/lib/fhir/operationOutcome';
import { correlationFrom } from '@/lib/server/correlation';
import { canReadMemberData } from '@/lib/authz/guard';
import { audit } from '@/lib/server/audit';
import { defaultEvidenceStore } from '@/lib/evidence/evidenceStore';
import { validateEvidenceId } from '@/lib/goldenThread/validate';
import { devMockEnabled } from '@/lib/server/devStubs';

// Seeded Evidence Record for mock/demo — represents Maria Redhawk's lumbar MRI
// PA decision chain as a Da Vinci CDex Coverage Determination Record.
function seededEvidenceRecord(id: string) {
  const ts = '2026-05-15T14:22:00Z';
  // Extract memberId and code from id pattern ev-{memberId}-{code}-{timestamp}
  const parts = id.split('-');
  const memberId = parts.length >= 3 ? `${parts[1]}_${parts[2]}` : 'MARIA_SD_001';
  const code = parts.length >= 4 ? parts[3] : '72148';
  return {
    id,
    memberId,
    order: { code, display: code === '72148' ? 'MRI Lumbar Spine w/o Contrast' : `CPT ${code}`, providerNpi: '1730154783' },
    createdAt: ts,
    status: 'open',
    entries: [
      { id: `${id}-e1`, ts, stage: 'eligibility', actor: 'system', type: 'eligibility', coverageRef: 'Coverage/cov-1', requiresPA: true, note: 'Active Medicaid coverage confirmed' },
      { id: `${id}-e2`, ts, stage: 'medical-necessity', actor: 'system', type: 'coverage-determination',
        determination: { outcome: 'requires-review', requiresPA: true, propensityToDeny: 0.71,
          deficiencies: [{ criterionId: 'C2', description: 'Neurological deficit documentation missing', severity: 'required' }],
          policyRef: 'Policy/MRI-LUMBAR-001', evaluatedAt: ts } },
      { id: `${id}-e3`, ts, stage: 'eligibility', actor: 'system', type: 'gold-card',
        exemption: { applied: false, providerNpi: '1730154783', code, payer: 'SD Medicaid', approvalRate: 0.71, lookbackMonths: 12, sampleSize: 14, basis: 'payer voluntary program', reason: 'Approval rate 71% — below 90% gold-card threshold' } },
      { id: `${id}-e4`, ts, stage: 'prior-auth', actor: 'system', type: 'propensity', score: 0.71, band: 'high' },
    ],
  };
}

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
    // In mock mode always return the seeded record — the in-memory store is empty
    // on a fresh session, but we still want to demonstrate the audit spine.
    if (devMockEnabled()) {
      const seeded = seededEvidenceRecord(id);
      await audit({ ts: new Date().toISOString(), actor: 'session-user', action: 'evidence.read', resourceRef: `Evidence/${id}`, correlationId, outcome: 'success' });
      return NextResponse.json(seeded, { status: 200 });
    }
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
