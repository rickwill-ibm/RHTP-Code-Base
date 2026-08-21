import { NextRequest, NextResponse } from 'next/server';
import { readRuntimeConfig } from '@/lib/runtimeConfig';
import { getScenario, DEFAULT_PROVIDER_NPI, DEFAULT_REVIEWER_EMAIL } from '@/lib/cms0057fEndpoints';

// GET /api/postman-environment?patient=MARIA_SD_001&mode=mock
// Generates and streams a Postman environment JSON file filled with
// values from the runtime config (or query param overrides).
// The browser downloads it directly — no manual copy-paste.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cfg = readRuntimeConfig();

  // Query params override runtime config (useful for one-off runs)
  const patientId = searchParams.get('patient') ?? cfg.postmanPatientId;
  const mode = (searchParams.get('mode') ?? cfg.mode) as 'mock' | 'production';
  const baseUrl = searchParams.get('baseUrl') ?? `http://localhost:4029`;

  const scenario = getScenario(patientId);
  const fhirGateway = mode === 'production' ? cfg.fhirGatewayBase : '(mock)';
  const providerNpi = cfg.postmanProviderNpi || DEFAULT_PROVIDER_NPI;
  const reviewerEmail = cfg.postmanReviewerEmail || DEFAULT_REVIEWER_EMAIL;

  const env = {
    id: `cms0057f-${mode}-${patientId}-${Date.now()}`,
    name: `CMS-0057-F ${mode === 'mock' ? 'Mock' : 'Production'} — ${scenario.firstName} ${scenario.lastName}`,
    _postman_variable_scope: 'environment',
    values: [
      { key: 'baseUrl', value: baseUrl, type: 'default', enabled: true },
      { key: 'patientId', value: scenario.platformId, type: 'default', enabled: true },
      { key: 'fhirPatientId', value: scenario.fhirPatientId, type: 'default', enabled: true },
      { key: 'patientFirstName', value: scenario.firstName, type: 'default', enabled: true },
      { key: 'patientLastName', value: scenario.lastName, type: 'default', enabled: true },
      { key: 'patientDob', value: scenario.dob, type: 'default', enabled: true },
      { key: 'patientState', value: scenario.state, type: 'default', enabled: true },
      { key: 'cptCode', value: scenario.cptCode, type: 'default', enabled: true },
      { key: 'procedureName', value: scenario.procedureName, type: 'default', enabled: true },
      { key: 'priorPayer', value: scenario.priorPayer, type: 'default', enabled: true },
      { key: 'providerNpi', value: providerNpi, type: 'default', enabled: true },
      { key: 'reviewerEmail', value: reviewerEmail, type: 'default', enabled: true },
      { key: 'fhirGatewayBase', value: fhirGateway, type: 'default', enabled: true },
      { key: 'p2pJobId', value: 'dev-p2p-job-001', type: 'default', enabled: true },
      { key: 'serverMode', value: mode, type: 'default', enabled: true },
      {
        key: 'wso2AuthorizeUrl',
        value: cfg.wso2AuthorizeUrl,
        type: 'default',
        enabled: mode === 'production',
      },
      {
        key: 'wso2TokenUrl',
        value: cfg.wso2TokenUrl,
        type: 'default',
        enabled: mode === 'production',
      },
      {
        key: 'wso2ClientId',
        value: cfg.wso2ClientId,
        type: 'default',
        enabled: mode === 'production',
      },
    ],
  };

  const filename = `cms0057f-${mode}-${patientId.toLowerCase().replace(/[^a-z0-9]/g, '-')}.postman_environment.json`;

  return new NextResponse(JSON.stringify(env, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
