#!/usr/bin/env bash
# Integrated install (Tier A) — one command to a running RHTP against a real FHIR
# data tier. Brings up FHIR + MySQL, seeds Maria, installs deps, and starts RHTP
# with a local dev session. Full CMS provisions need Tier B (see INTEGRATED_INSTALL.md).
#
# Usage:  bash install/install.sh          (from the repo root)
#         bash install/install.sh --no-dev (skip starting the dev server)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Prereq check"
for t in node npm docker; do
  command -v "$t" >/dev/null 2>&1 || { echo "MISSING: $t"; exit 1; }
done
docker compose version >/dev/null 2>&1 || { echo "MISSING: docker compose v2"; exit 1; }

echo "==> .env.local"
if [ ! -f .env.local ]; then
  cp install/.env.cms0057f.example .env.local
  echo "   created .env.local from template (edit SESSION_SECRET before sharing)"
else
  echo "   .env.local exists — leaving as-is"
fi

echo "==> Backbone (FHIR + MySQL) up"
docker compose -f install/docker-compose.backbone.yml up -d

echo "==> Waiting for FHIR to be healthy…"
for i in $(seq 1 40); do
  if curl -fsS http://localhost:8090/fhir/metadata >/dev/null 2>&1; then echo "   FHIR ready"; break; fi
  sleep 3
  [ "$i" = "40" ] && { echo "   FHIR did not become ready"; exit 1; }
done

echo "==> Init MySQL schema (if reference scripts present)"
for f in demo-backends/wso2_payer_portal_bff/scripts/init_db.sql bulk-export-client/scripts/init_db.sql; do
  if [ -f "$f" ]; then
    docker exec -i rhtp-mysql mysql -uroot -prhtp cms0057f < "$f" 2>/dev/null && echo "   applied $f" || echo "   skipped $f"
  fi
done

echo "==> Seed Maria into FHIR"
FHIR_GATEWAY_BASE=http://localhost:8090/fhir node tools/seed/load-maria.mjs || echo "   seed step reported an issue (continuing)"

echo "==> npm install"
npm install --no-audit --no-fund

echo "==> Validate (type-check + unit tests)"
npm run type-check
npm run test

echo ""
echo "✅ Integrated dev backbone is up."
echo "   FHIR:  http://localhost:8090/fhir/Patient/MARIA_SD_001"
echo "   Next:  npm run dev  → open http://localhost:4029/cms  → 'Sign in (dev)' → Patient Access"
if [ "${1:-}" != "--no-dev" ]; then
  echo "==> Starting RHTP (Ctrl+C to stop)"
  npm run dev
fi
