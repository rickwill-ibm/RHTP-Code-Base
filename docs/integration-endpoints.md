# Integration endpoints (ENV-2)

RHTP's BFF calls the **APIM gateway**, never raw service ports. Fill these from your ENV-1 backbone (or Devant) and set them as **server-only** env vars in `.env.local` (no `NEXT_PUBLIC_` prefix).

| Purpose | Env var | Example |
|---|---|---|
| FHIR (gateway) | `FHIR_GATEWAY_BASE` | `https://localhost:8243/<fhir-ctx>/fhir/r4` |
| CDS Hooks (gateway) | `CDS_GATEWAY_BASE` | `https://localhost:8243/<cds-ctx>` |
| Bulk export (gateway) | `BULK_GATEWAY_BASE` | `https://localhost:8243/<bulk-ctx>/bulk` |
| OAuth authorize (WSO2 IS) | `WSO2_AUTHORIZE_URL` | `https://localhost:9453/oauth2/authorize` |
| OAuth token (WSO2 IS) | `WSO2_TOKEN_URL` | `https://localhost:9453/oauth2/token` |
| OAuth client id | `WSO2_CLIENT_ID` | _(from the APIM app)_ |
| OAuth client secret | `WSO2_CLIENT_SECRET` | _(secret — server only)_ |
| Redirect URI | `WSO2_REDIRECT_URI` | `http://localhost:4029/api/auth/callback` |
| Session encryption key | `SESSION_SECRET` | _(32+ random chars)_ |
| Dev mock auth (OFF for real use) | `ALLOW_DEV_MOCK_AUTH` | `false` |

## :8080 port collision — resolved
RHTP's own dev FHIR (`fhir/docker-compose.yml`) and the WSO2 reference `fhir-service` both default to **:8080**. Decision: the BFF targets the **APIM gateway** (`:8243/<ctx>`), not `:8080`. If you also run a local raw FHIR for offline dev, move it off :8080 to avoid the clash.
