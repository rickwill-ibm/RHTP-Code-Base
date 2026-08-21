import { NextRequest, NextResponse } from 'next/server';
import { readRuntimeConfig, writeRuntimeConfig } from '@/lib/runtimeConfig';
import type { RuntimeConfig } from '@/lib/runtimeConfig';

// ─── GET /api/config-status ───────────────────────────────────────────────────
// Returns current runtime config (no secrets — wso2ClientSecret never exposed).

export async function GET() {
  const cfg = readRuntimeConfig();
  return NextResponse.json({
    mode:             cfg.mode,
    fhirGatewayBase:  cfg.mode === 'mock' ? '(mock — no server required)' : cfg.fhirGatewayBase,
    fhirGatewayLive:  cfg.mode === 'production' ? cfg.fhirGatewayBase : null,
    cdsGatewayBase:   cfg.cdsGatewayBase,
    bulkGatewayBase:  cfg.bulkGatewayBase,
    wso2AuthorizeUrl: cfg.wso2AuthorizeUrl,
    wso2TokenUrl:     cfg.wso2TokenUrl,
    wso2ClientId:     cfg.wso2ClientId,
    wso2Configured:   Boolean(cfg.wso2AuthorizeUrl && cfg.wso2ClientId),
    allowDevMockAuth: cfg.allowDevMockAuth,
    authMode:         cfg.allowDevMockAuth && !cfg.wso2AuthorizeUrl ? 'dev-mock' : 'wso2-pkce',
    postmanPatientId:     cfg.postmanPatientId,
    postmanReviewerEmail: cfg.postmanReviewerEmail,
    postmanProviderNpi:   cfg.postmanProviderNpi,
    postmanScopes:        cfg.postmanScopes,
    lastSaved:            cfg.lastSaved,
    appPort:              4029,
    newmanCommand:        'npm run test:contract',
    environments: {
      mock:       'tools/contract/local.postman_environment.json',
      production: 'tools/contract/production.postman_environment.json',
    },
    collectionPath: 'tools/contract/cms0057f.postman_collection.json',
    totalRequests:  20,
    mandateSections: [
      '§1 Patient Access',
      '§2 Provider Access',
      '§3 Payer-to-Payer',
      '§4 Prior Authorization',
      'Infrastructure',
    ],
  });
}

// ─── POST /api/config-status ──────────────────────────────────────────────────
// Accepts a partial RuntimeConfig patch, merges it, persists to .rhtp-config.json,
// and returns the full updated config.

export async function POST(req: NextRequest) {
  let patch: Partial<RuntimeConfig>;
  try {
    patch = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Never allow the client to inject wso2ClientSecret through this route
  const { ...safePatch } = patch as any;
  delete safePatch.wso2ClientSecret;

  const updated = writeRuntimeConfig(safePatch);

  return NextResponse.json({
    ok: true,
    mode:             updated.mode,
    fhirGatewayBase:  updated.fhirGatewayBase,
    allowDevMockAuth: updated.allowDevMockAuth,
    postmanPatientId: updated.postmanPatientId,
    postmanScopes:    updated.postmanScopes,
    lastSaved:        updated.lastSaved,
  });
}
