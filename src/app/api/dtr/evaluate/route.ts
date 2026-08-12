/**
 * BFF: DTR medical-necessity evaluation.
 * POST { patientId, cptCode, procedureName }
 *
 * In dev-mock mode returns Maria Redhawk's lumbar MRI scenario (CPT 72148).
 * In live mode forwards to the Policy Engine at POLICY_ENGINE_URL.
 */
import { NextRequest, NextResponse } from 'next/server';
import { devMockEnabled } from '@/lib/server/devStubs';

export const runtime = 'nodejs';

// ── Maria Redhawk demo mock ───────────────────────────────────────────────────

function mariaMock(cptCode: string) {
  return {
    policyTitle: 'MRI Lumbar Spine — Medical Necessity Policy (CPT 72148)',
    cptCode,
    allMet: false,
    groups: [
      {
        id: 1,
        title: '≥ 6 Weeks Conservative Therapy',
        status: 'met',
        required: true,
        description:
          'Patient must have completed at least 6 weeks of conservative therapy without adequate relief prior to advanced imaging.',
        fhirQuery: {
          resourceType: 'Procedure',
          searchParam: 'code',
          system: 'http://snomed.info/sct',
          codes: ['229070002', '229070003'],
          valueComparison: '>= 6 weeks documented',
        },
        sourceExcerpt:
          'Coverage is available for lumbar MRI when the member has completed a minimum 6-week trial of conservative therapy without satisfactory improvement.',
        leaf: {
          code: 'SNOMED 229070002',
          label: 'Physical therapy — lumbar region',
          evidence: 'PT sessions documented 02/10/2026 – 03/28/2026 (7 weeks)',
          source: 'emr',
          recordedDate: '2026-03-28',
          performerName: 'Dr. James Whitfield MD',
        },
      },
      {
        id: 2,
        title: 'Neurological Deficit or Red Flag Symptom',
        status: 'gap',
        required: true,
        description:
          'Documentation must include at least one qualifying neurological deficit (radiculopathy, motor weakness, numbness/tingling) or a recognized red flag symptom.',
        fhirQuery: {
          resourceType: 'Condition',
          searchParam: 'code',
          system: 'http://hl7.org/fhir/sid/icd-10-cm',
          codes: ['M54.4', 'M54.3', 'G55', 'M47.816'],
        },
        sourceExcerpt:
          'Advanced imaging is appropriate when neurological deficit, radiculopathy, or a red flag symptom is documented in the clinical record.',
        candidateCodes: [
          { code: 'M54.4',   system: 'http://hl7.org/fhir/sid/icd-10-cm', label: 'Lumbago with sciatica — right side' },
          { code: 'M54.3',   system: 'http://hl7.org/fhir/sid/icd-10-cm', label: 'Sciatica' },
          { code: 'G55',     system: 'http://hl7.org/fhir/sid/icd-10-cm', label: 'Nerve root and plexus compressions' },
          { code: 'M47.816', system: 'http://hl7.org/fhir/sid/icd-10-cm', label: 'Spondylosis with radiculopathy — lumbar region' },
        ],
      },
      {
        id: 3,
        title: 'Ordering Provider Specialty Appropriate',
        status: 'met',
        required: false,
        description:
          'Ordering provider must be a PCP, orthopedic surgeon, neurologist, or physiatrist.',
        sourceExcerpt:
          'Requests from out-of-specialty providers are subject to additional review. PCP ordering is standard.',
        leaf: {
          code: 'NPI 1234567890',
          label: 'Dr. James Whitfield MD — Family Medicine / FQHC',
          evidence: 'PCP ordering — specialty confirmed in-network',
          source: 'emr',
        },
      },
    ],
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => null)) as {
    patientId?: string;
    cptCode?: string;
    procedureName?: string;
  } | null;

  if (!body?.cptCode) {
    return NextResponse.json({ error: 'cptCode required' }, { status: 400 });
  }

  // Dev mock mode — always return Maria's lumbar MRI scenario
  if (devMockEnabled()) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json(mariaMock(body.cptCode));
  }

  // Live mode — forward to Policy Engine
  const policyEngineUrl = process.env.POLICY_ENGINE_URL ?? 'http://localhost:8083';
  try {
    const res = await fetch(`${policyEngineUrl}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: body.patientId, cptCode: body.cptCode }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : 502 });
  } catch {
    // Policy Engine offline — fall through to mock
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json(mariaMock(body.cptCode));
  }
}
