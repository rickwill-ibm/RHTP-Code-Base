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
import { getPatientById } from '@/lib/patientRegistry';

// CPT code → procedure metadata — mirrors PATIENT_PA_SCENARIOS in api-explorer and devStubs
const CPT_META: Record<string, { display: string; policyRef: string; deficiency: string; payer: string; propensity: number; propensityBand: string }> = {
  '72148': { display: 'MRI Lumbar Spine w/o Contrast',          policyRef: 'Policy/MRI-LUMBAR-001',   deficiency: 'Neurological deficit documentation missing',                  payer: 'SD Medicaid',    propensity: 0.71, propensityBand: 'high'   },
  '75561': { display: 'Cardiac MRI w/ and w/o contrast',        policyRef: 'Policy/CARDIAC-MRI-001',  deficiency: 'Clinical justification beyond echocardiogram missing',        payer: 'UHC Community',  propensity: 0.48, propensityBand: 'medium' },
  '93306': { display: 'Echocardiogram (complete transthoracic)', policyRef: 'Policy/ECHO-001',         deficiency: 'None — all criteria met',                                     payer: 'Molina SD',      propensity: 0.12, propensityBand: 'low'    },
  '99243': { display: 'Nephrology office consultation',          policyRef: 'Policy/SPECIALTY-001',    deficiency: 'None — all criteria met',                                     payer: 'Anthem BCBS SD', propensity: 0.08, propensityBand: 'low'    },
  '99244': { display: 'Pulmonology office consultation',         policyRef: 'Policy/SPECIALTY-002',    deficiency: 'None — all criteria met',                                     payer: 'Meridian SD',    propensity: 0.18, propensityBand: 'low'    },
};
const DEFAULT_META = CPT_META['72148'];

// Seeded Evidence Record for mock/demo — patient-aware.
//
// ID pattern: ev-{memberId}-{cptCode}-{epochMs}
// memberId may contain hyphens (e.g. PAT-0042), so we parse from the right:
//   last segment  = epochMs
//   second-to-last = cptCode
//   everything between "ev-" and the two trailing segments = memberId
function seededEvidenceRecord(id: string) {
  const ts = '2026-05-15T14:22:00Z';
  const withoutPrefix = id.startsWith('ev-') ? id.slice(3) : id;
  const parts = withoutPrefix.split('-');
  const cptCode  = parts.length >= 3 ? parts[parts.length - 2] : '72148';
  const memberId = parts.length >= 3 ? parts.slice(0, parts.length - 2).join('-') : 'MARIA_SD_001';
  const code = cptCode || '72148';
  const meta = CPT_META[code] ?? DEFAULT_META;

  // Resolve patient name for the coverage ref note
  const patient = getPatientById(memberId);
  const patientName = patient?.name ?? memberId;
  const coverageNote = `Active ${patient?.contract ?? 'Medicaid'} coverage confirmed for ${patientName}`;

  return {
    id,
    memberId,
    patientName,
    order: { code, display: meta.display, providerNpi: patient?.pcp ?? '1730154783' },
    createdAt: ts,
    status: 'open',
    entries: [
      { id: `${id}-e1`, ts, stage: 'eligibility', actor: 'system', type: 'eligibility', coverageRef: `Coverage/cov-${memberId}`, requiresPA: true, note: coverageNote },
      { id: `${id}-e2`, ts, stage: 'medical-necessity', actor: 'system', type: 'coverage-determination',
        determination: { outcome: meta.propensity > 0.3 ? 'requires-review' : 'approved', requiresPA: meta.propensity > 0.3, propensityToDeny: meta.propensity,
          deficiencies: meta.deficiency === 'None — all criteria met'
            ? []
            : [{ criterionId: 'C2', description: meta.deficiency, severity: 'required' }],
          policyRef: meta.policyRef, evaluatedAt: ts } },
      { id: `${id}-e3`, ts, stage: 'eligibility', actor: 'system', type: 'gold-card',
        exemption: { applied: meta.propensity <= 0.1, providerNpi: patient?.pcp ?? '1730154783', code, payer: meta.payer,
          approvalRate: meta.propensity, lookbackMonths: 12, sampleSize: 14,
          basis: 'payer voluntary program',
          reason: meta.propensity <= 0.1
            ? `Approval rate ${Math.round((1 - meta.propensity) * 100)}% — gold-card threshold met`
            : `Approval rate ${Math.round((1 - meta.propensity) * 100)}% — below 90% gold-card threshold` } },
      { id: `${id}-e4`, ts, stage: 'prior-auth', actor: 'system', type: 'propensity', score: meta.propensity, band: meta.propensityBand },
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
