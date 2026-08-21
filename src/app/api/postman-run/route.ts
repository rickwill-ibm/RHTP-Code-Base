import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readRuntimeConfig } from '@/lib/runtimeConfig';
import { getScenario, DEFAULT_PROVIDER_NPI, DEFAULT_REVIEWER_EMAIL } from '@/lib/cms0057fEndpoints';

// Export Node.js runtime — required for child_process (Newman).
// This route CANNOT run on the Edge runtime.
export const runtime = 'nodejs';

// POST /api/postman-run
// Runs the CMS-0057-F collection via Newman (imported as a library, not spawned).
// Streams results as Server-Sent Events (SSE) so the UI can show live pass/fail.
//
// Body (all optional — falls back to runtime config):
//   { patientId?, mode?, scopes? }
//
// SSE event types:
//   start       { collection, environment, totalRequests }
//   request     { name, method, url, index, total }
//   result      { name, status, latencyMs, passed, failed, assertions: [{name, passed, error?}] }
//   done        { passed, failed, totalMs }
//   error       { message }

export async function POST(req: NextRequest) {
  const cfg = readRuntimeConfig();
  let body: { patientId?: string; mode?: string; scopes?: string[] } = {};
  try { body = await req.json(); } catch { /* use defaults */ }

  const patientId = body.patientId ?? cfg.postmanPatientId;
  const mode      = (body.mode ?? cfg.mode) as 'mock' | 'production';
  const scenario  = getScenario(patientId);

  // Build the environment object Newman will use
  const envValues: Record<string, string> = {
    baseUrl:          'http://localhost:4029',
    patientId:        scenario.platformId,
    fhirPatientId:    scenario.fhirPatientId,
    patientFirstName: scenario.firstName,
    patientLastName:  scenario.lastName,
    patientDob:       scenario.dob,
    patientState:     scenario.state,
    cptCode:          scenario.cptCode,
    procedureName:    scenario.procedureName,
    priorPayer:       scenario.priorPayer,
    providerNpi:      cfg.postmanProviderNpi  || DEFAULT_PROVIDER_NPI,
    reviewerEmail:    cfg.postmanReviewerEmail || DEFAULT_REVIEWER_EMAIL,
    fhirGatewayBase:  mode === 'production' ? cfg.fhirGatewayBase : '(mock)',
    p2pJobId:         'dev-p2p-job-001',
    serverMode:       mode,
    wso2AuthorizeUrl: cfg.wso2AuthorizeUrl,
    wso2TokenUrl:     cfg.wso2TokenUrl,
    wso2ClientId:     cfg.wso2ClientId,
  };

  const collectionPath = path.resolve(process.cwd(), 'tools/contract/cms0057f.postman_collection.json');

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      }

      // Dynamically require Newman (devDependency — available in dev/local, not in
      // serverless prod deploys. Gracefully errors if absent.)
      let newman: typeof import('newman');
      try {
        newman = require('newman');
      } catch {
        send('error', { message: 'Newman is not installed. Run: npm install --save-dev newman' });
        controller.close();
        return;
      }

      const environmentValues = Object.entries(envValues).map(([key, value]) => ({
        key, value, enabled: true,
      }));

      let totalPassed = 0;
      let totalFailed = 0;
      let requestIndex = 0;
      const startMs = Date.now();

      send('start', {
        collection: collectionPath,
        patient: `${scenario.firstName} ${scenario.lastName} (${patientId})`,
        mode,
        totalRequests: 20,
      });

      newman.run(
        {
          collection:   require(collectionPath),
          environment:  { id: 'runtime', name: 'Runtime Config', values: environmentValues },
          reporters:    ['cli'],
          // Follow redirects for the session-establish login request
          insecure:     true,
          // Cookie jar persists the rhtp_smart_session cookie across requests
          cookieJar:    true as unknown as any,
        },
        (err: Error | null) => {
          if (err) {
            send('error', { message: err.message });
          } else {
            send('done', {
              passed:  totalPassed,
              failed:  totalFailed,
              totalMs: Date.now() - startMs,
            });
          }
          controller.close();
        },
      )
        .on('beforeRequest', (err: any, args: any) => {
          if (err) return;
          requestIndex++;
          send('request', {
            index:  requestIndex,
            total:  20,
            name:   args.item?.name ?? '—',
            method: args.request?.method ?? '—',
            url:    args.request?.url?.toString() ?? '—',
          });
        })
        .on('request', (err: any, args: any) => {
          if (err) return;
          const assertions = (args.executions ?? []).flatMap((e: any) =>
            (e.assertions ?? []).map((a: any) => ({
              name:   a.assertion,
              passed: !a.error,
              error:  a.error?.message ?? null,
            })),
          );
          const passed = assertions.filter((a: any) => a.passed).length;
          const failed = assertions.filter((a: any) => !a.passed).length;
          totalPassed += passed;
          totalFailed += failed;
          send('result', {
            name:       args.item?.name ?? '—',
            status:     args.response?.code ?? null,
            latencyMs:  args.response?.responseTime ?? null,
            passed,
            failed,
            assertions,
          });
        });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
