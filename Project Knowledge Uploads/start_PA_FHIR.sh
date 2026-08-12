#!/usr/bin/env zsh
# =============================================================================
#  start_PA_FHIR.sh
#  Starts the full Prior Authorization FHIR stack in 5 stages:
#
#   Stage 1 — FHIR servers          (EMR :8080, Payer :8082 — Docker if available,
#                                    otherwise an in-memory Node mock automatically)
#   Stage 2 — Seed FHIR data       (Rachel Green — EMR + payer records)
#   Stage 3 — CDS Hooks server     (:8081 — order-sign CRD hook)
#   Stage 4 — Intelligent Policy   (:8083 — LLM policy engine + DTR eval)
#   Stage 5 — PA SMART App         (:4032 — Next.js frontend, live FHIR mode)
#
#  All paths this script needs (PA_ROOT below) are absolute, so it works the
#  same wherever this file itself is run from — Desktop, the project folder,
#  anywhere. A copy lives at both:
#    ~/Desktop/start_PA_FHIR.sh
#    "Documents/Prior Authorization Rebuild/Project Knowledge Uploads/start_PA_FHIR.sh"
#
#  Usage:
#    chmod +x ~/Desktop/start_PA_FHIR.sh
#    ~/Desktop/start_PA_FHIR.sh
#    ~/Desktop/start_PA_FHIR.sh --mock     # run frontend in mock mode only
#    ~/Desktop/start_PA_FHIR.sh --stop     # stop all PA services
# =============================================================================

# ── Colour helpers ────────────────────────────────────────────────────────────
BOLD=$'\e[1m'; RESET=$'\e[0m'
GREEN=$'\e[32m'; YELLOW=$'\e[33m'; RED=$'\e[31m'; CYAN=$'\e[36m'; BLUE=$'\e[34m'

ok()   { echo "${GREEN}  ✓${RESET}  $*"; }
info() { echo "${CYAN}  ➜${RESET}  $*"; }
warn() { echo "${YELLOW}  ⚠${RESET}  $*"; }
err()  { echo "${RED}  ✗${RESET}  $*"; }
head() { echo "\n${BOLD}${BLUE}══════════════════════════════════════════════════${RESET}"; \
         echo "${BOLD}${BLUE}  $*${RESET}"; \
         echo "${BOLD}${BLUE}══════════════════════════════════════════════════${RESET}"; }

# ── Paths ─────────────────────────────────────────────────────────────────────
# However this script was actually invoked (its real location, a relative
# path, whatever) — reuse that exact invocation in printed messages below,
# instead of a hardcoded guess at where it lives.
SCRIPT_SELF="$0"
PA_ROOT="/Users/richardwilliams/Documents/Prior Authorization Rebuild/PA-Standalone-SmartApp"
CDS_DIR="$PA_ROOT/services/cds-hooks-server"
PE_DIR="$PA_ROOT/services/policy-engine"
SEED_SCRIPT="$PA_ROOT/infra/seed/seed-all.mjs"
POLICY_CACHE="$PE_DIR/policies/bariatric-surgery-cpt-43644.json"
LOG_DIR="$HOME/.pa_fhir_logs"
mkdir -p "$LOG_DIR"

# ── PID tracking ──────────────────────────────────────────────────────────────
PID_FILE="$HOME/.pa_fhir_pids"

# ── Parse args ────────────────────────────────────────────────────────────────
MOCK_MODE=false
STOP_MODE=false
for arg in "$@"; do
  [[ "$arg" == "--mock" ]] && MOCK_MODE=true
  [[ "$arg" == "--stop" ]] && STOP_MODE=true
done

# ═════════════════════════════════════════════════════════════════════════════
#  --stop : kill all PA services started by this script
# ═════════════════════════════════════════════════════════════════════════════
if [[ "$STOP_MODE" == true ]]; then
  head "Stopping PA FHIR Stack"
  if [[ -f "$PID_FILE" ]]; then
    while IFS= read -r line; do
      svc=$(echo "$line" | cut -d: -f1)
      pid=$(echo "$line" | cut -d: -f2)
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null && ok "Stopped $svc (PID $pid)"
      else
        warn "$svc (PID $pid) was already stopped"
      fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  else
    warn "No PID file found — nothing to stop"
  fi
  if command -v docker >/dev/null 2>&1 && docker ps --format "{{.Names}}" 2>/dev/null | grep -qE "^(tcoc-hapi-fhir|pa-hapi-payer)$"; then
    info "Docker FHIR containers are NOT stopped (they persist between runs)"
    info "To stop Docker containers: docker stop tcoc-hapi-fhir pa-hapi-payer"
  fi
  echo ""
  exit 0
fi

# ═════════════════════════════════════════════════════════════════════════════
#  Banner
# ═════════════════════════════════════════════════════════════════════════════
clear
echo ""
echo "${BOLD}${BLUE}  ██████╗  █████╗     ███████╗██╗  ██╗██╗██████╗ ${RESET}"
echo "${BOLD}${BLUE}  ██╔══██╗██╔══██╗    ██╔════╝██║  ██║██║██╔══██╗${RESET}"
echo "${BOLD}${BLUE}  ██████╔╝███████║    █████╗  ███████║██║██████╔╝${RESET}"
echo "${BOLD}${BLUE}  ██╔═══╝ ██╔══██║    ██╔══╝  ██╔══██║██║██╔══██╗${RESET}"
echo "${BOLD}${BLUE}  ██║     ██║  ██║    ██║     ██║  ██║██║██║  ██║${RESET}"
echo "${BOLD}${BLUE}  ╚═╝     ╚═╝  ╚═╝    ╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝${RESET}"
echo ""
echo "  ${BOLD}Prior Authorization FHIR Stack${RESET}  ·  CRD · DTR · PAS · CMS-0057-F"
echo "  IBM  ·  Da Vinci  ·  SMART on FHIR"
echo ""

[[ "$MOCK_MODE" == true ]] && warn "Running in MOCK MODE — only the frontend will start" && echo ""

# ═════════════════════════════════════════════════════════════════════════════
#  Helpers
# ═════════════════════════════════════════════════════════════════════════════
wait_for_port() {
  local port=$1 label=$2 max=${3:-60} i=0
  info "Waiting for $label on :$port …"
  until nc -z localhost "$port" 2>/dev/null; do
    sleep 1; i=$((i+1))
    [[ $i -ge $max ]] && err "$label did not start on :$port within ${max}s" && return 1
  done
  ok "$label is up on :$port"
  return 0
}

save_pid() { echo "$1:$2" >> "$PID_FILE"; }

# Clear old PIDs
rm -f "$PID_FILE"

# ═════════════════════════════════════════════════════════════════════════════
#  STAGE 1 — FHIR servers (Docker if available, otherwise a no-Docker
#             in-memory Node substitute — services/mock-fhir-server)
# ═════════════════════════════════════════════════════════════════════════════
if [[ "$MOCK_MODE" == false ]]; then
  MOCK_FHIR_DIR="$PA_ROOT/services/mock-fhir-server"
  DOCKER_AVAILABLE=false
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    DOCKER_AVAILABLE=true
  fi

  if [[ "$DOCKER_AVAILABLE" == true ]]; then
    head "Stage 1 · FHIR Servers (Docker)"

    # EMR FHIR — tcoc-hapi-fhir :8080
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "^tcoc-hapi-fhir$"; then
      ok "EMR FHIR (tcoc-hapi-fhir) already running on :8080"
    else
      info "Starting EMR FHIR server (tcoc-hapi-fhir) …"
      docker start tcoc-hapi-fhir 2>/dev/null || \
      docker run -d \
        --name tcoc-hapi-fhir \
        -p 8080:8080 \
        -e hapi.fhir.fhir_version=R4 \
        -e hapi.fhir.default_encoding=JSON \
        -e "spring.datasource.url=jdbc:h2:mem:hapi-emr;DB_CLOSE_DELAY=-1" \
        -e spring.datasource.driverClassName=org.h2.Driver \
        -e spring.datasource.username=sa \
        -e 'spring.datasource.password=' \
        -e spring.jpa.hibernate.ddl-auto=update \
        -e "hapi.fhir.cors.allowed_origin=*" \
        hapiproject/hapi:latest >> "$LOG_DIR/emr-fhir.log" 2>&1
      wait_for_port 8080 "EMR FHIR" 120 || { err "EMR FHIR failed to start. Check $LOG_DIR/emr-fhir.log"; exit 1; }
    fi

    # Payer FHIR — pa-hapi-payer :8082
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "^pa-hapi-payer$"; then
      ok "Payer FHIR (pa-hapi-payer) already running on :8082"
    else
      info "Starting Payer FHIR server (pa-hapi-payer) …"
      docker start pa-hapi-payer 2>/dev/null || \
      docker run -d \
        --name pa-hapi-payer \
        -p 8082:8080 \
        -e hapi.fhir.fhir_version=R4 \
        -e hapi.fhir.default_encoding=JSON \
        -e "spring.datasource.url=jdbc:h2:mem:hapi-payer;DB_CLOSE_DELAY=-1" \
        -e spring.datasource.driverClassName=org.h2.Driver \
        -e spring.datasource.username=sa \
        -e 'spring.datasource.password=' \
        -e spring.jpa.hibernate.ddl-auto=update \
        -e "hapi.fhir.cors.allowed_origin=*" \
        hapiproject/hapi:latest >> "$LOG_DIR/payer-fhir.log" 2>&1
      wait_for_port 8082 "Payer FHIR" 120 || { err "Payer FHIR failed to start. Check $LOG_DIR/payer-fhir.log"; exit 1; }
    fi

    # RHTP FHIR — rhtp-fhir :8090
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "^rhtp-fhir$"; then
      ok "RHTP FHIR (rhtp-fhir) already running on :8090"
    else
      info "Starting RHTP FHIR server (rhtp-fhir) …"
      docker start rhtp-fhir 2>/dev/null && ok "rhtp-fhir started" || warn "rhtp-fhir not found — skipping (not required for PA app)"
    fi
  else
    head "Stage 1 · FHIR Servers (No Docker — in-memory mock)"
    warn "Docker not found or not running — using services/mock-fhir-server instead."
    warn "This is a lightweight in-memory FHIR substitute: full read/search/seed/submit"
    warn "support for everything this app uses, but data resets each time you restart it."

    if [[ ! -d "$MOCK_FHIR_DIR/node_modules" ]]; then
      info "Installing mock-fhir-server dependencies (first run only) …"
      (cd "$MOCK_FHIR_DIR" && npm install --no-audit --no-fund >> "$LOG_DIR/mock-fhir-install.log" 2>&1) \
        || { err "npm install failed. Check $LOG_DIR/mock-fhir-install.log"; exit 1; }
    fi

    # EMR mock FHIR — :8080
    if nc -z localhost 8080 2>/dev/null; then
      ok "EMR FHIR (mock) already running on :8080"
    else
      info "Starting EMR FHIR mock server …"
      (cd "$MOCK_FHIR_DIR" && PORT=8080 FHIR_LABEL=EMR node src/index.mjs >> "$LOG_DIR/emr-fhir.log" 2>&1) &
      save_pid "mock-fhir-emr" "$!"
      wait_for_port 8080 "EMR FHIR (mock)" 20 || { err "EMR FHIR mock failed to start. Check $LOG_DIR/emr-fhir.log"; exit 1; }
    fi

    # Payer mock FHIR — :8082
    if nc -z localhost 8082 2>/dev/null; then
      ok "Payer FHIR (mock) already running on :8082"
    else
      info "Starting Payer FHIR mock server …"
      (cd "$MOCK_FHIR_DIR" && PORT=8082 FHIR_LABEL=PAYER node src/index.mjs >> "$LOG_DIR/payer-fhir.log" 2>&1) &
      save_pid "mock-fhir-payer" "$!"
      wait_for_port 8082 "Payer FHIR (mock)" 20 || { err "Payer FHIR mock failed to start. Check $LOG_DIR/payer-fhir.log"; exit 1; }
    fi

    info "Skipping RHTP FHIR (:8090) — Docker not available, and it's not required for the PA app."
  fi

  # ═══════════════════════════════════════════════════════════════════════════
  #  STAGE 2 — Seed FHIR data (idempotent)
  # ═══════════════════════════════════════════════════════════════════════════
  head "Stage 2 · Seed FHIR Data (Rachel Green)"

  # Quick check: if Rachel Green already exists in EMR, skip seeding
  RG_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/fhir/Patient/patient-rachel-green" 2>/dev/null)
  if [[ "$RG_CHECK" == "200" ]]; then
    ok "Rachel Green already seeded in EMR FHIR — skipping"
  else
    info "Seeding EMR + Payer FHIR servers (Rachel Green) …"
    if node "$SEED_SCRIPT" >> "$LOG_DIR/seed.log" 2>&1; then
      ok "FHIR data seeded successfully"
    else
      warn "Seed script reported errors — check $LOG_DIR/seed.log"
      warn "Continuing anyway (data may already exist)"
    fi
  fi

  # ═══════════════════════════════════════════════════════════════════════════
  #  STAGE 3 — CDS Hooks server
  # ═══════════════════════════════════════════════════════════════════════════
  head "Stage 3 · CDS Hooks Server (:8081)"

  if nc -z localhost 8081 2>/dev/null; then
    ok "CDS Hooks server already running on :8081"
  else
    info "Starting CDS Hooks server …"
    cd "$CDS_DIR"
    PORT=8081 \
    EMR_FHIR_BASE=http://localhost:8080/fhir \
    PAYER_FHIR_BASE=http://localhost:8082/fhir \
    node src/index.mjs >> "$LOG_DIR/cds-hooks.log" 2>&1 &
    CDS_PID=$!
    save_pid "cds-hooks" "$CDS_PID"
    wait_for_port 8081 "CDS Hooks" 30 || { err "CDS Hooks failed. Check $LOG_DIR/cds-hooks.log"; exit 1; }
  fi
  cd - > /dev/null

  # ═══════════════════════════════════════════════════════════════════════════
  #  STAGE 4 — Intelligent Policy Engine
  # ═══════════════════════════════════════════════════════════════════════════
  head "Stage 4 · Intelligent Policy Engine (:8083)"

  if nc -z localhost 8083 2>/dev/null; then
    ok "Policy Engine already running on :8083"
  else
    OPENAI_KEY=""
    GROQ_KEY=""

    # Resolve OpenAI key — check multiple locations. Done silently
    # regardless of whether the bariatric policy is already cached, so a key
    # saved on a prior run is picked up automatically for ingesting a NEW
    # policy later, without forcing a re-prompt.
    for env_file in \
      "$HOME/.openai_key" \
      "$HOME/.config/pa_fhir/openai_key" \
      "$HOME/Desktop/RHTP_Code_Base/.env.local" \
      "$HOME/Desktop/RHTP_Code_Base/.env"; do
      if [[ -f "$env_file" ]]; then
        _key=$(grep "^OPENAI_API_KEY=" "$env_file" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
        if [[ -n "$_key" && "$_key" != "your-openai-api-key-here" && ${#_key} -gt 20 ]]; then
          OPENAI_KEY="$_key"
          ok "OpenAI key loaded from $env_file"
          break
        fi
      fi
    done

    # Resolve Groq key the same way. Groq is a free, no-credit-card LLM
    # provider (https://console.groq.com/keys) that the Policy Engine can use
    # in place of OpenAI — its API is OpenAI-compatible, so extraction works
    # identically either way, just via a different (free) vendor.
    for env_file in \
      "$HOME/.groq_key" \
      "$HOME/.config/pa_fhir/groq_key" \
      "$HOME/Desktop/RHTP_Code_Base/.env.local" \
      "$HOME/Desktop/RHTP_Code_Base/.env"; do
      if [[ -f "$env_file" ]]; then
        _key=$(grep "^GROQ_API_KEY=" "$env_file" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
        if [[ -n "$_key" && "$_key" != "your-groq-api-key-here" && ${#_key} -gt 10 ]]; then
          GROQ_KEY="$_key"
          ok "Groq key loaded from $env_file"
          break
        fi
      fi
    done

    if [[ -f "$POLICY_CACHE" ]]; then
      # The bariatric policy ships pre-cached (extracted once from the real
      # policy text, checked into the repo) — the demo runs end to end with
      # zero LLM dependency even if no key was found above. Only prompt for
      # one if you actually need to ingest a NEW policy via the Ingest
      # Policy screen later.
      ok "Bariatric policy already cached — no LLM key needed to start"
      if [[ -z "$OPENAI_KEY" && -z "$GROQ_KEY" ]]; then
        info "(No LLM key found — ingesting a NEW policy will fail until one is set. Groq is free, no card: https://console.groq.com/keys)"
      fi
    elif [[ -z "$OPENAI_KEY" && -z "$GROQ_KEY" ]]; then
      echo ""
      warn "No LLM API key found (OpenAI or Groq) in standard locations."
      warn "The policy engine needs one to extract payer policies via LLM."
      echo ""
      info "Groq is free and needs no credit card — get a key at https://console.groq.com/keys"
      echo -n "  ${BOLD}Paste an OpenAI key (sk-…) or Groq key (gsk_…), or just press Enter to skip:${RESET} "
      read -r PASTED_KEY
      echo ""
      if [[ -z "$PASTED_KEY" || ${#PASTED_KEY} -lt 20 ]]; then
        warn "No valid key provided — starting Policy Engine WITHOUT an LLM."
        warn "Policy ingestion of NEW policies will fail, but everything else works fine."
      else
        if [[ "$PASTED_KEY" == gsk_* ]]; then
          GROQ_KEY="$PASTED_KEY"
          SAVE_FILE="$HOME/.groq_key"
          SAVE_VAR="GROQ_API_KEY"
        else
          OPENAI_KEY="$PASTED_KEY"
          SAVE_FILE="$HOME/.openai_key"
          SAVE_VAR="OPENAI_API_KEY"
        fi
        # Offer to save for future runs
        echo -n "  ${BOLD}Save key to $SAVE_FILE for future runs? [y/N]:${RESET} "
        read -r SAVE_KEY
        if [[ "$SAVE_KEY" =~ ^[Yy]$ ]]; then
          echo "$SAVE_VAR=$PASTED_KEY" > "$SAVE_FILE"
          chmod 600 "$SAVE_FILE"
          ok "Key saved to $SAVE_FILE (chmod 600)"
        fi
      fi
    fi

    info "Starting Policy Engine …"
    cd "$PE_DIR"
    PORT=8083 \
    OPENAI_API_KEY="$OPENAI_KEY" \
    GROQ_API_KEY="$GROQ_KEY" \
    EMR_FHIR_BASE=http://localhost:8080/fhir \
    PAYER_FHIR_BASE=http://localhost:8082/fhir \
    node src/index.mjs >> "$LOG_DIR/policy-engine.log" 2>&1 &
    PE_PID=$!
    save_pid "policy-engine" "$PE_PID"
    wait_for_port 8083 "Policy Engine" 20 || { err "Policy Engine failed. Check $LOG_DIR/policy-engine.log"; exit 1; }
    cd - > /dev/null

    # Auto-ingest bariatric policy if not yet cached (only reachable when a
    # key was actually provided above, since the cached branch never gets here
    # needing ingestion)
    if [[ ! -f "$POLICY_CACHE" && ( -n "$OPENAI_KEY" || -n "$GROQ_KEY" ) ]]; then
      info "Ingesting bariatric surgery policy via LLM (first-time, ~15s) …"
      INGEST_RESP=$(curl -s -X POST http://localhost:8083/ingest \
        -H "Content-Type: application/json" \
        -d '{"policyId":"bariatric-surgery-cpt-43644"}' 2>/dev/null)
      if echo "$INGEST_RESP" | grep -q '"success":true'; then
        GROUPS=$(echo "$INGEST_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('criteriaGroups','?'))" 2>/dev/null)
        ok "Bariatric policy ingested ($GROUPS criteria groups cached)"
      else
        warn "Policy ingestion returned: $INGEST_RESP"
        warn "If the key was wrong, re-run the script with a valid key"
      fi
    fi
  fi
fi  # end [[ MOCK_MODE == false ]]

# ═════════════════════════════════════════════════════════════════════════════
#  STAGE 5 — PA SMART App (Next.js frontend)
# ═════════════════════════════════════════════════════════════════════════════
head "Stage 5 · PA SMART App (:4032)"

APP_DIR="$PA_ROOT"
ENV_LOCAL="$APP_DIR/.env.local"

# Set correct mode in .env.local
if [[ "$MOCK_MODE" == true ]]; then
  sed -i '' 's/^NEXT_PUBLIC_USE_MOCK_DATA=.*/NEXT_PUBLIC_USE_MOCK_DATA=true/' "$ENV_LOCAL" 2>/dev/null
  warn "Frontend set to MOCK MODE"
else
  sed -i '' 's/^NEXT_PUBLIC_USE_MOCK_DATA=.*/NEXT_PUBLIC_USE_MOCK_DATA=false/' "$ENV_LOCAL" 2>/dev/null
  ok "Frontend set to LIVE FHIR MODE"
fi

if nc -z localhost 4032 2>/dev/null; then
  ok "PA SMART App already running on :4032"
else
  info "Starting PA SMART App (Next.js dev server) …"
  cd "$APP_DIR"
  npm run dev >> "$LOG_DIR/pa-app.log" 2>&1 &
  APP_PID=$!
  save_pid "pa-app" "$APP_PID"
  wait_for_port 4032 "PA SMART App" 60 || { err "PA App failed to start. Check $LOG_DIR/pa-app.log"; exit 1; }
  cd - > /dev/null
fi

# The bare /launch route requires real SMART OAuth launch params (iss +
# launch) per SMART App Launch 2.0 — there's no real EHR here to supply
# them, so this points at the mock FHIR server's own built-in mock
# authorization server (services/mock-fhir-server — /auth/authorize +
# /auth/token), which completes a real, spec-compliant PKCE launch for the
# seeded Rachel Green patient. In --mock mode the frontend skips OAuth
# entirely, so the bare URL is fine there.
if [[ "$MOCK_MODE" == true ]]; then
  LAUNCH_URL="http://localhost:4032/launch"
else
  LAUNCH_URL="http://localhost:4032/launch?iss=http%3A%2F%2Flocalhost%3A8080%2Ffhir&launch=patient-rachel-green"
fi

# ═════════════════════════════════════════════════════════════════════════════
#  Final status board
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo "${BOLD}${GREEN}══════════════════════════════════════════════════${RESET}"
echo "${BOLD}${GREEN}  ✓  PA FHIR Stack is Running${RESET}"
echo "${BOLD}${GREEN}══════════════════════════════════════════════════${RESET}"
echo ""

if [[ "$MOCK_MODE" == false ]]; then
  if [[ "$DOCKER_AVAILABLE" == true ]]; then
    echo "  ${BOLD}FHIR Servers${RESET}"
    echo "  EMR FHIR      (Docker · HAPI R4)   →  http://localhost:8080/fhir"
    echo "  Payer FHIR    (Docker · HAPI R4)   →  http://localhost:8082/fhir"
    echo "  RHTP FHIR     (Docker · HAPI R4)   →  http://localhost:8090/fhir"
  else
    echo "  ${BOLD}FHIR Servers${RESET}  (no Docker — in-memory mock, resets on restart)"
    echo "  EMR FHIR      (mock)               →  http://localhost:8080/fhir"
    echo "  Payer FHIR    (mock)               →  http://localhost:8082/fhir"
  fi
  echo ""
  echo "  ${BOLD}PA Services${RESET}"
  echo "  CDS Hooks     (order-sign CRD)     →  http://localhost:8081/cds-services"
  echo "  Policy Engine (LLM extraction · DTR eval)  →  http://localhost:8083/health"
  echo ""
fi

echo "  ${BOLD}Frontend${RESET}"
echo "  PA SMART App  (Next.js · CRD·DTR·PAS) →  ${BOLD}$LAUNCH_URL${RESET}"
echo ""
echo "  ${BOLD}Logs${RESET}  →  $LOG_DIR/"
echo "  ${BOLD}PIDs${RESET}  →  $PID_FILE"
echo ""

if [[ "$MOCK_MODE" == false ]]; then
  echo "  ${BOLD}Test sequence:${RESET}"
  echo "  1.  Browser opens to the SMART launch URL above automatically"
  echo "      (completes a real OAuth PKCE handshake via the mock IdP, then lands on /app)"
  echo "  2.  Step 1 → click 'Check Prior Auth Requirements'"
  echo "  3.  Step 2 → verify CRD checklist pulls live Rachel Green coverage"
  echo "  4.  Step 3 → verify DTR tree shows live FHIR criteria (E66.01 ✓, BMI ✓, comorbidity ✗)"
  echo "  5.  Step 4 → submit and get a PA number"
  echo ""
  echo "  ${BOLD}To stop all services:${RESET}  $SCRIPT_SELF --stop"
else
  echo "  ${BOLD}Mock mode:${RESET}  All data is hardcoded — no FHIR servers required."
  echo "  Open  $LAUNCH_URL  and walk the full CRD→DTR→PAS flow."
  echo ""
  echo "  ${BOLD}To stop:${RESET}  $SCRIPT_SELF --stop"
fi

echo ""

# Open the app in the default browser after a short delay
(sleep 3 && open "$LAUNCH_URL") &
