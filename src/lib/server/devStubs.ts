/**
 * Dev-mock demonstration stubs (mock data demonstration).
 *
 * When ALLOW_DEV_MOCK_AUTH=true and the WSO2/Ballerina backbone is not present,
 * the operation-driven flows ($member-match, CRD, $questionnaire-package, bulk
 * export, PAS) have no server to answer them. These canned responses let ALL
 * FOUR provisions be demonstrated offline on mock data. They are gated strictly
 * by devMockEnabled() and never fire in production.
 */
import { serverEnv } from './env';
import type { CdsCard } from './cdsClient';

export function devMockEnabled(): boolean {
  return serverEnv().allowDevMockAuth === true;
}

/** CRD cards for the MRI lumbar (CPT 72148) example. */
export function devCrdCards(): CdsCard[] {
  return [
    {
      summary: 'Prior authorization required: MRI lumbar spine w/o contrast (CPT 72148)',
      indicator: 'critical',
      detail:
        'Payer coverage policy requires documentation of conservative therapy. Complete the DTR questionnaire to proceed.',
      links: [{ label: 'Open documentation (DTR)', url: '/prior-auth', type: 'smart' }],
    },
    {
      summary: 'Alternative: plain radiograph may be covered without prior authorization',
      indicator: 'info',
    },
  ];
}

/** A canned $member-match result identifying the seeded demo member. */
export function devMemberMatch(): unknown {
  return {
    resourceType: 'Parameters',
    parameter: [
      {
        name: 'MemberPatient',
        resource: {
          resourceType: 'Patient',
          id: 'MARIA_SD_001',
          name: [{ family: 'Redhawk', given: ['Maria'] }],
        },
      },
    ],
  };
}

export function devBulkStart(): { jobId: string } {
  return { jobId: 'dev-p2p-job-001' };
}

/** Poll result — completed with a mock export file (5-year history stand-in). */
export function devBulkStatus(): { state: string; fileUrls: string[] } {
  return { state: 'completed', fileUrls: ['/dev/export/prior-payer-history.ndjson'] };
}

/** A DTR $questionnaire-package Bundle wrapping the seeded MRI questionnaire. */
export function devQuestionnairePackage(): unknown {
  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      {
        resource: {
          resourceType: 'Questionnaire',
          id: 'Q_MRI_LUMBAR',
          url: 'http://example.org/Questionnaire/mri-lumbar',
          status: 'active',
          title: 'MRI Lumbar Spine — Documentation Requirements (DTR)',
          item: [
            {
              linkId: 'q1',
              text: 'Conservative therapy attempted (>= 6 weeks)?',
              type: 'boolean',
              required: true,
            },
            {
              linkId: 'q2',
              text: 'Neurological deficit present?',
              type: 'boolean',
              required: true,
            },
            { linkId: 'q3', text: 'Relevant clinical notes', type: 'string' },
          ],
        },
      },
    ],
  };
}

/** A canned approved ClaimResponse for the human-approved PAS submission. */
export function devClaimResponseApproved(approvedBy: string): unknown {
  return {
    resourceType: 'ClaimResponse',
    id: 'dev-cr-approved',
    status: 'active',
    type: { text: 'MRI lumbar spine w/o contrast' },
    use: 'preauthorization',
    patient: { reference: 'Patient/MARIA_SD_001' },
    outcome: 'complete',
    disposition: `Prior authorization approved (dev demo). Reviewed by ${approvedBy}.`,
  };
}
