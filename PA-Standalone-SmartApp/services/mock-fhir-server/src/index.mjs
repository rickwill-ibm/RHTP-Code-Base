/**
 * mock-fhir-server — in-memory, no-Docker substitute for HAPI FHIR.
 *
 * This is NOT a general-purpose FHIR server. It implements exactly the
 * operations the rest of this repo's own code actually issues against the
 * EMR (:8080) and Payer (:8082) FHIR servers:
 *
 *   GET  /fhir/metadata                          — health check
 *   POST /fhir                                    — transaction Bundle (PUT entries) — seeding
 *   GET  /fhir/:resourceType/:id                   — read
 *   GET  /fhir/:resourceType?patient=X&status=Y    — search (Coverage lookup in CRD)
 *   GET  /fhir/:resourceType?patient=X&code=A,B    — search (DTR criterion evaluation)
 *   POST /fhir/Claim/$submit                       — PAS submission stub
 *
 * Callers: services/cds-hooks-server/src/fhir-helpers.mjs,
 * services/policy-engine/src/fhir-client.mjs, src/lib/fhir/fhirClient.ts,
 * src/lib/fhir/patientLookup.ts, src/lib/pas/pasService.ts,
 * infra/seed/seed-all.mjs — none of them use any FHIR feature beyond what's
 * above, so this in-memory store is a drop-in replacement for local dev when
 * Docker isn't available. Data does not persist across restarts.
 */

import express from "express";
import cors from "cors";
import crypto from "crypto";

const PORT = parseInt(process.env.PORT ?? "8080", 10);
const LABEL = process.env.FHIR_LABEL ?? `mock-fhir:${PORT}`;

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ type: ["application/json", "application/fhir+json"], limit: "8mb" }));
app.use(express.urlencoded({ extended: false })); // OAuth token endpoint uses form-encoded bodies

/** resourceType -> Map<id, resource> */
const store = new Map();

function bucket(resourceType) {
  if (!store.has(resourceType)) store.set(resourceType, new Map());
  return store.get(resourceType);
}

function fhirJson(res, body, status = 200) {
  res.status(status).type("application/fhir+json").send(JSON.stringify(body));
}

function operationOutcome(res, status, diagnostics) {
  fhirJson(
    res,
    {
      resourceType: "OperationOutcome",
      issue: [{ severity: "error", code: "not-found", diagnostics }],
    },
    status
  );
}

// ── Health ─────────────────────────────────────────────────────────────────────
app.get("/fhir/metadata", (_req, res) => {
  fhirJson(res, {
    resourceType: "CapabilityStatement",
    status: "active",
    date: new Date().toISOString(),
    kind: "instance",
    software: { name: "pa-mock-fhir-server", version: "1.0.0" },
    fhirVersion: "4.0.1",
    format: ["json", "application/fhir+json"],
    rest: [{ mode: "server" }],
  });
});

// ── PAS submit stub (declare before the generic :resourceType routes) ─────────
app.post(/^\/fhir\/Claim\/\$submit$/, (req, res) => {
  const id = crypto.randomUUID();
  fhirJson(res, {
    resourceType: "Bundle",
    type: "collection",
    entry: [
      {
        resource: {
          resourceType: "ClaimResponse",
          id,
          status: "active",
          outcome: "complete",
          created: new Date().toISOString(),
        },
      },
    ],
  });
});

// ── Transaction bundle (seeding) ───────────────────────────────────────────────
app.post("/fhir", (req, res) => {
  const bundle = req.body;
  if (!bundle || bundle.resourceType !== "Bundle") {
    return operationOutcome(res, 400, "Expected a Bundle resource");
  }

  const responseEntries = [];
  for (const entry of bundle.entry ?? []) {
    const method = entry.request?.method ?? "PUT";
    const url = entry.request?.url ?? "";
    const [resourceType, urlId] = url.split("/");
    const resource = entry.resource;

    if (!resourceType) {
      responseEntries.push({ response: { status: "400 Bad Request" } });
      continue;
    }

    if (method === "DELETE") {
      const id = urlId;
      const existed = id && bucket(resourceType).delete(id);
      responseEntries.push({ response: { status: existed ? "204 No Content" : "404 Not Found" } });
      continue;
    }

    const id = urlId || resource?.id || crypto.randomUUID();
    const stored = { ...resource, id, resourceType };
    const existed = bucket(resourceType).has(id);
    bucket(resourceType).set(id, stored);

    responseEntries.push({
      response: {
        status: existed ? "200 OK" : "201 Created",
        location: `${resourceType}/${id}/_history/1`,
        etag: 'W/"1"',
        lastModified: new Date().toISOString(),
      },
    });
  }

  fhirJson(res, {
    resourceType: "Bundle",
    type: "transaction-response",
    entry: responseEntries,
  });
});

// ── SMART on FHIR — minimal mock authorization server ───────────────────────
// No real EHR/IdP exists in this local, no-Docker environment, so the app's
// OAuth PKCE handshake (src/lib/smart/smartLaunch.ts) could never otherwise
// complete. These three routes implement just enough of SMART App Launch
// 2.0 — discovery, /authorize, /token — for a real, spec-compliant launch
// to complete end to end against this same server. It auto-approves
// immediately (no login screen) since this is a local dev/demo IdP, not a
// production authorization server. Declared before the generic
// /fhir/:resourceType/:id route below so ".well-known" doesn't get parsed
// as a resource type.
const authCodes = new Map(); // code -> { patientId, scope, codeChallenge, exp }

app.get("/fhir/.well-known/smart-configuration", (req, res) => {
  const base = `${req.protocol}://${req.get("host")}`;
  res.json({
    authorization_endpoint: `${base}/auth/authorize`,
    token_endpoint: `${base}/auth/token`,
    capabilities: ["launch-ehr", "client-public", "sso-openid-connect", "context-ehr-patient"],
    code_challenge_methods_supported: ["S256"],
  });
});

app.get("/auth/authorize", (req, res) => {
  const { redirect_uri, state, launch, scope, code_challenge } = req.query;
  if (!redirect_uri || !state) {
    return res.status(400).send("Missing redirect_uri or state");
  }
  const code = crypto.randomUUID();
  authCodes.set(code, {
    patientId: String(launch ?? "patient-rachel-green"),
    scope: String(scope ?? ""),
    codeChallenge: code_challenge ? String(code_challenge) : null,
    exp: Date.now() + 5 * 60 * 1000,
  });
  const redirectUrl = new URL(String(redirect_uri));
  redirectUrl.searchParams.set("code", code);
  redirectUrl.searchParams.set("state", String(state));
  res.redirect(302, redirectUrl.toString());
});

app.post("/auth/token", (req, res) => {
  const { grant_type, code, code_verifier } = req.body ?? {};
  if (grant_type !== "authorization_code" || !code) {
    return res.status(400).json({ error: "invalid_request" });
  }
  const entry = authCodes.get(String(code));
  if (!entry || entry.exp < Date.now()) {
    return res.status(400).json({ error: "invalid_grant", error_description: "Unknown or expired code" });
  }
  authCodes.delete(String(code)); // single use

  if (entry.codeChallenge) {
    if (!code_verifier) {
      return res.status(400).json({ error: "invalid_grant", error_description: "Missing code_verifier" });
    }
    const computed = crypto
      .createHash("sha256")
      .update(String(code_verifier))
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    if (computed !== entry.codeChallenge) {
      return res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
    }
  }

  // Look up a real seeded Encounter for this patient, if one exists
  let encounterId;
  for (const enc of bucket("Encounter").values()) {
    if (referenceMatches(enc, entry.patientId)) {
      encounterId = enc.id;
      break;
    }
  }

  res.json({
    access_token: `mock-token-${crypto.randomUUID()}`,
    token_type: "Bearer",
    expires_in: 3600,
    scope: entry.scope,
    patient: entry.patientId,
    encounter: encounterId,
    smart_user: "Practitioner/practitioner-aagaard",
  });
});

// ── Read ────────────────────────────────────────────────────────────────────────
app.get("/fhir/:resourceType/:id", (req, res) => {
  const { resourceType, id } = req.params;
  const resource = bucket(resourceType).get(id);
  if (!resource) {
    return operationOutcome(res, 404, `${resourceType}/${id} not found`);
  }
  fhirJson(res, resource);
});

// ── Search ────────────────────────────────────────────────────────────────────
function referenceMatches(resource, patientParam) {
  const refFields = [resource.subject, resource.beneficiary, resource.patient];
  const target = patientParam.includes("/") ? patientParam : `Patient/${patientParam}`;
  const bareTarget = patientParam.replace(/^Patient\//, "");
  return refFields.some((ref) => {
    if (!ref?.reference) return false;
    return ref.reference === target || ref.reference === `Patient/${bareTarget}` || ref.reference.endsWith(`/${bareTarget}`);
  });
}

function codingListsFor(resource) {
  return [resource.code?.coding ?? [], resource.valueCodeableConcept?.coding ?? []].flat();
}

function codeMatches(resource, codeParamValue) {
  const tokens = codeParamValue.split(",").map((t) => t.trim()).filter(Boolean);
  const codings = codingListsFor(resource);
  return tokens.some((token) => {
    const [maybeSystem, maybeCode] = token.includes("|") ? token.split("|") : [null, token];
    return codings.some((c) => {
      if (maybeSystem && c.system !== maybeSystem) return false;
      return c.code === maybeCode;
    });
  });
}

app.get("/fhir/:resourceType", (req, res) => {
  const { resourceType } = req.params;
  const { patient, subject, status, code } = req.query;
  const patientFilter = patient ?? subject;

  let resources = [...bucket(resourceType).values()];

  if (patientFilter) {
    resources = resources.filter((r) => referenceMatches(r, String(patientFilter)));
  }
  if (status) {
    resources = resources.filter((r) => r.status === status);
  }
  if (code) {
    resources = resources.filter((r) => codeMatches(r, String(code)));
  }

  fhirJson(res, {
    resourceType: "Bundle",
    type: "searchset",
    total: resources.length,
    entry: resources.map((resource) => ({ resource })),
  });
});

app.listen(PORT, () => {
  console.log(`[${LABEL}] Mock FHIR server (no Docker) running on http://localhost:${PORT}/fhir`);
  console.log(`[${LABEL}] In-memory only — data resets on restart. Re-run seed-all.mjs after restarting.`);
});
