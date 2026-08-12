/**
 * SMART App Launch 2.0 helpers.
 *
 * buildAuthorizationUrl  — Step 1: discover the EHR's auth endpoint via
 *                          FHIR metadata / .well-known/smart-configuration
 *                          and redirect the browser to it.
 *
 * exchangeCodeForToken   — Step 2: exchange the authorization code for an
 *                          access token at the EHR's token endpoint.
 *
 * SmartContext            — The resolved context held in React state and
 *                          passed to every service layer.
 */

export interface SmartContext {
  /** Raw SMART access token */
  accessToken: string;
  /** Token type (always "Bearer") */
  tokenType: string;
  /** FHIR base URL of the issuing EHR */
  fhirBaseUrl: string;
  /** Optional payer FHIR base URL resolved from Coverage.payor */
  payerFhirBaseUrl?: string;
  /** Patient resource id in context */
  patientId: string;
  /** Encounter id if provided in launch context */
  encounterId?: string;
  /** Practitioner / user resource id */
  userId?: string;
  /** Decoded id_token claims (subset) */
  idTokenClaims?: Record<string, unknown>;
  /** Scopes granted */
  scopes: string[];
  /** Expiry epoch (ms) */
  expiresAt: number;
}

const CLIENT_ID =
  process.env.NEXT_PUBLIC_SMART_CLIENT_ID ?? "pa-smart-app";
const REDIRECT_URI =
  process.env.NEXT_PUBLIC_SMART_REDIRECT_URI ??
  "http://localhost:4032/app"; // must match the app's actual port (package.json: next dev -p 4032)
const SCOPE =
  process.env.NEXT_PUBLIC_SMART_SCOPE ??
  "launch launch/patient launch/encounter patient/*.read openid fhirUser offline_access";

/** Fetch and cache the .well-known/smart-configuration for an issuer. */
async function fetchSmartConfig(
  iss: string
): Promise<{ authorization_endpoint: string; token_endpoint: string }> {
  const url = `${iss.replace(/\/$/, "")}/.well-known/smart-configuration`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cannot fetch SMART config from ${url}`);
  return res.json();
}

/** Build the authorization redirect URL and store PKCE state in sessionStorage. */
export async function buildAuthorizationUrl(
  iss: string,
  launch: string
): Promise<string> {
  const { authorization_endpoint } = await fetchSmartConfig(iss);

  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  sessionStorage.setItem("pa_state", state);
  sessionStorage.setItem("pa_code_verifier", codeVerifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    state,
    aud: iss,
    launch,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${authorization_endpoint}?${params}`;
}

/** Exchange the authorization code for an access token. */
export async function exchangeCodeForToken(
  code: string,
  state: string
): Promise<SmartContext> {
  const storedState = sessionStorage.getItem("pa_state");
  if (state !== storedState) throw new Error("State mismatch — CSRF check failed.");

  const codeVerifier = sessionStorage.getItem("pa_code_verifier") ?? "";
  const iss = sessionStorage.getItem("pa_iss") ?? "";

  const { token_endpoint } = await fetchSmartConfig(iss);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: codeVerifier,
  });

  const res = await fetch(token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);

  const data = await res.json();

  return {
    accessToken: data.access_token,
    tokenType: data.token_type ?? "Bearer",
    fhirBaseUrl: iss,
    patientId: data.patient ?? "",
    encounterId: data.encounter,
    userId: data.smart_user,
    scopes: (data.scope ?? "").split(" "),
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
