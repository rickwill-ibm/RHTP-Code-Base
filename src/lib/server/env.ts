/**
 * Server-only environment configuration for CMS-0057-F integration.
 *
 * SECURITY (plan §1.4): none of these keys use the NEXT_PUBLIC_ prefix, so they
 * are NEVER exposed to the browser bundle. Import this only from server code
 * (src/app/api/** or src/lib/server/**).
 */

export interface ServerEnv {
  /** APIM gateway FHIR base, e.g. https://localhost:8243/<ctx>/fhir/r4 */
  fhirGatewayBase: string;
  /** CDS Hooks gateway base */
  cdsGatewayBase: string;
  /** Bulk export gateway base */
  bulkGatewayBase: string;
  /** WSO2 IS OAuth2 endpoints */
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  /** Symmetric key used to encrypt the session cookie payload */
  sessionSecret: string;
  /** When true and WSO2 is not configured, allow a dev-only mock token (F-3 TODO). */
  allowDevMockAuth: boolean;
}

function opt(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

/**
 * Read + validate server env. Throws only for the keys a given code path needs
 * (callers decide), so the app still boots for read-only/dev flows.
 */
export function serverEnv(): ServerEnv {
  return {
    fhirGatewayBase: opt('FHIR_GATEWAY_BASE', 'http://localhost:8080/fhir/r4'),
    cdsGatewayBase: opt('CDS_GATEWAY_BASE', 'http://localhost:9096'),
    bulkGatewayBase: opt('BULK_GATEWAY_BASE', 'http://localhost:8091/bulk'),
    authorizeUrl: opt('WSO2_AUTHORIZE_URL'),
    tokenUrl: opt('WSO2_TOKEN_URL'),
    clientId: opt('WSO2_CLIENT_ID'),
    clientSecret: opt('WSO2_CLIENT_SECRET'),
    redirectUri: opt('WSO2_REDIRECT_URI', 'http://localhost:4029/api/auth/callback'),
    scope: opt('WSO2_SCOPE', 'openid fhirUser launch/patient patient/*.read offline_access'),
    sessionSecret: opt('SESSION_SECRET', 'dev-only-insecure-session-secret-change-me'),
    allowDevMockAuth: opt('ALLOW_DEV_MOCK_AUTH', 'true').toLowerCase() === 'true',
  };
}

/** Assert the WSO2 OAuth keys are present; used by the real auth path. */
export function requireWso2(env: ServerEnv): void {
  const missing = (['authorizeUrl', 'tokenUrl', 'clientId', 'clientSecret'] as const).filter(
    (k) => !env[k]
  );
  if (missing.length) {
    throw new Error(
      `WSO2 OAuth not configured — missing: ${missing.join(', ')}. ` +
        `Set them in .env.local (server-only, no NEXT_PUBLIC_ prefix). See plan ENV-3.`
    );
  }
}
