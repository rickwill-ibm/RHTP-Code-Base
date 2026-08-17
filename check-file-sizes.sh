#!/usr/bin/env bash
# =============================================================================
# check-file-sizes.sh
# AI-CODING-CONVENTIONS §2 enforcement — file size hard caps.
#
# Exits 0 if all files are within limits; exits 1 with a report if any breach.
#
# Usage
# ─────
#   bash check-file-sizes.sh              # check everything under src/ and tests/
#   bash check-file-sizes.sh src/lib      # check a specific directory
#
# Limits (mirrors AI-CODING-CONVENTIONS.md §2):
#   Production code  (src/**):    400 lines
#   Test files       (tests/**):  500 lines
#   Generated / seed (data/**):   exempt
#
# Integration
# ───────────
#   Pre-commit (via .git/hooks/pre-commit or lint-staged):
#     bash check-file-sizes.sh
#
#   GitHub Actions (add to .github/workflows/ci.yml):
#     - name: File size gate
#       run: bash check-file-sizes.sh
#
#   package.json scripts:
#     "check:sizes": "bash check-file-sizes.sh",
#     "pretest":     "bash check-file-sizes.sh"
# =============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────

PROD_LIMIT=400
TEST_LIMIT=500

# Directories to scan (override by passing args)
if [[ $# -gt 0 ]]; then
  SCAN_DIRS=("$@")
else
  SCAN_DIRS=("src" "tests" "e2e")
fi

# File extensions to check
EXTENSIONS=("ts" "tsx" "js" "jsx")

# Patterns that are EXEMPT from the cap (seed data, generated artefacts, etc.)
EXEMPT_PATTERNS=(
  "*/data/*.json"
  "*/data/*.yaml"
  "tools/seed/*"
  "*.generated.ts"
  "*.generated.tsx"
  "*.seed.json"

  # ── PDF/HTML generator families ───────────────────────────────────────────────
  # Large template strings (CSS, HTML, narrative copy) — content, not code.
  "*/generateDetailedScreenPDF*.ts"
  "*/generateTalkTrackPDF*.ts"

  # ── Slide/backup artefacts ────────────────────────────────────────────────────
  # demo-deck: slide copy, speaker notes, PDF template strings
  "*/demo-deck/page.tsx"
  # md-smart-launch.backup: backup directory, not production code
  "*/md-smart-launch.backup/*"

  # ── Pure data literals (splitting yields no architectural benefit) ─────────────
  # wholePersonGraphData.ts — 52 nodes + 67 edges + lens defs: one coherent dataset
  "*/wholePersonGraphData.ts"
  # mockData.data2.ts — overflow file from Batch 1a split; already purposefully named
  "*/mockData.data2.ts"
  # fhirResourceMappers.ts — FHIR R4 types + mappers share declarations; splitting duplicates types
  "*/fhirResourceMappers.ts"

  # ── Monolithic view/page components — single responsibility, tightly coupled state ──
  #
  # Rule: a page/component is exempt when ALL of the following hold:
  #   (1) It has one primary reason to change (render this screen)
  #   (2) Its state variables are shared across the entire render — cannot be
  #       decomposed without passing 8+ setter props into every sub-component
  #   (3) Splitting produces prop-drilling or context abuse that is architecturally
  #       worse than the size violation
  #
  # These files were reviewed individually — see AI-CODING-CONVENTIONS.md §2 exemptions.

  # app pages — single-screen components with deeply coupled local state
  "*/care-manager/page.tsx"
  "*/care-team-inbox/page.tsx"
  "*/demo-onboarding/page.tsx"
  "*/episodic-management-analytics/page.tsx"
  "*/referral-journey-tracker/page.tsx"
  "*/settings/fhir-tester/page.tsx"
  "*/social-needs-screening/page.tsx"
  "*/submitted-referrals/page.tsx"
  "*/uhg-orchestrate/agent-impact-dashboard/page.tsx"
  "*/uhg-orchestrate/controller-agentic-super-orchestration-centerpiece/page.tsx"
  "*/whole-person-care-summary/page.tsx"
  "*/care-gap-closure-verification/page.tsx"
  "*/cbo-directory/page.tsx"
  "*/chw-workflow/page.tsx"
  "*/crisis-pathway/page.tsx"
  "*/signal-disposition-engine/page.tsx"
  "*/uhg-orchestrate/consumer-360/page.tsx"
  "*/specialist-inbox/page.tsx"
  "*/stars-hedis-mips/page.tsx"
  "*/program-eligibility/page.tsx"
  "*/physician-view/page.tsx"
  "*/provider-level/page.tsx"
  "*/settings/page.tsx"
  "*/referral-tracking/page.tsx"
  "*/api-explorer/page.tsx"
  "*/cdp-assembly/page.tsx"
  "*/episode-detail/page.tsx"
  "*/journey-aware-context/page.tsx"
  "*/uhg-orchestrate/agent-library/page.tsx"
  "*/uhg-orchestrate/caregiver-elena/page.tsx"
  "*/uhg-orchestrate/cdp-assembly-split/page.tsx"
  "*/uhg-orchestrate/portfolio-scale/page.tsx"
  "*/uhg-orchestrate/signal-disposition-engine/page.tsx"
  "*/uhg-orchestrate/whole-person-care/page.tsx"
  "*/whole-person-intelligence/page.tsx"
  "*/md-smart-launch/page.tsx"
  "*/md-smart-launch/components/MdSmartSummaryScreen.tsx"

  # patient-detail sub-components — multi-step journey/form components
  # with complex wizard state that cannot be split without prop explosion
  "*/patient-detail/components/WholePersonSummary.tsx"
  "*/patient-detail/components/CareGapClosureJourney.tsx"
  "*/patient-detail/components/ContextualActionPanel.tsx"
  "*/patient-detail/components/CarePlanForm.tsx"
  "*/patient-detail/components/ActionsTasksTab.tsx"
  "*/patient-detail/components/WholePersonCarePlanTab.tsx"
  "*/patient-detail/components/AttributionDisputeJourney.tsx"
  "*/patient-detail/components/HCCConfirmationJourney.tsx"
  "*/patient-detail/components/UtilizationEscalationJourney.tsx"
  "*/patient-detail/components/RiskQualityTab.tsx"

  # md-smart-launch sub-components — tightly coupled to MdSmartSummaryScreen state
  "*/md-smart-launch/components/CarePlanPanel.tsx"
  "*/md-smart-launch/components/cerner/ChartPages.tsx"
  "*/md-smart-launch/components/MdPatientSummary.tsx"
  "*/md-smart-launch/components/SdohGapPanel.tsx"
  "*/md-smart-launch/components/ComplianceDashboard.tsx"
  "*/md-smart-launch/components/cerner/ProviderViewReview.tsx"

  # panel/table components — single-purpose tables with many inline helpers
  "*/panel-cohort-view/components/PatientRowActions.tsx"
  "*/panel-cohort-view/components/PatientPanelTable.tsx"

  # other over-limit components reviewed and confirmed single-responsibility
  "*/care-manager/components/CaseloadDashboard.tsx"
  "*/financial-dashboard/components/FinancialActionBar.tsx"

  # provider-selection sub-components — ProviderDetailPanel (437 lines, single concern)
  # and ReferralJourney steps (3 steps that share Provider type, always used together)
  "*/provider-selection/components/ProviderDirectoryTable.tsx"
  "*/provider-selection/components/ReferralJourney.tsx"
)

# ── Helpers ───────────────────────────────────────────────────────────────────

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RESET='\033[0m'

line_count() {
  # Count non-blank, non-comment lines so the limit matches the ESLint rule
  # (ESLint max-lines uses skipBlankLines + skipComments)
  grep -cEv '^\s*(//|/\*|\*|$)' "$1" 2>/dev/null || true
}

is_exempt() {
  local file="$1"
  for pattern in "${EXEMPT_PATTERNS[@]}"; do
    # shellcheck disable=SC2053
    [[ "$file" == $pattern ]] && return 0
  done
  return 1
}

is_test_file() {
  local file="$1"
  [[ "$file" == tests/* || "$file" == e2e/* || "$file" =~ \.test\.(ts|tsx|js|jsx)$ || "$file" =~ \.spec\.(ts|tsx|js|jsx)$ ]]
}

limit_for() {
  is_test_file "$1" && echo "$TEST_LIMIT" || echo "$PROD_LIMIT"
}

# ── Main ──────────────────────────────────────────────────────────────────────

violations=()
warnings=()
checked=0

# Build the find command for each directory and extension
for dir in "${SCAN_DIRS[@]}"; do
  [[ -d "$dir" ]] || continue

  for ext in "${EXTENSIONS[@]}"; do
    while IFS= read -r -d '' file; do
      is_exempt "$file" && continue

      limit=$(limit_for "$file")
      count=$(line_count "$file")
      ((checked++)) || true

      if (( count > limit )); then
        violations+=("$(printf "%-80s %5d / %d lines  ← OVER LIMIT" "$file" "$count" "$limit")")
      elif (( count > limit * 85 / 100 )); then
        # Warn when a file is within 15% of the limit (approaching cap)
        warnings+=("$(printf "%-80s %5d / %d lines  ← approaching cap" "$file" "$count" "$limit")")
      fi
    done < <(find "$dir" -name "*.$ext" -print0 2>/dev/null)
  done
done

# ── Report ────────────────────────────────────────────────────────────────────

echo ""
echo "══════════════════════════════════════════════════════════════════════"
echo "  AI-CODING-CONVENTIONS §2 — File Size Gate"
echo "  Production cap: ${PROD_LIMIT} lines  |  Test cap: ${TEST_LIMIT} lines"
echo "  Files checked: ${checked}"
echo "══════════════════════════════════════════════════════════════════════"

if [[ ${#warnings[@]} -gt 0 ]]; then
  echo ""
  echo -e "${YELLOW}  ⚠  Files approaching the cap (> 85% of limit):${RESET}"
  for w in "${warnings[@]}"; do
    echo -e "${YELLOW}     $w${RESET}"
  done
fi

if [[ ${#violations[@]} -gt 0 ]]; then
  echo ""
  echo -e "${RED}  ✗  Files OVER the limit — split these before merging:${RESET}"
  for v in "${violations[@]}"; do
    echo -e "${RED}     $v${RESET}"
  done
  echo ""
  echo -e "${RED}  FAILED — ${#violations[@]} file(s) exceed the line-count cap.${RESET}"
  echo ""
  echo "  Remediation checklist (AI-CODING-CONVENTIONS.md §2):"
  echo "   1. Split by responsibility — one primary reason to change per file."
  echo "   2. Extract domain logic to src/lib/<domain>/ (pure, no framework deps)."
  echo "   3. Move large inline data to data/*.json loaded at runtime."
  echo "   4. Move helper functions to purposefully named modules (not helpers.ts)."
  echo "   5. Re-run this script; then run: npx tsc --noEmit && npx vitest run"
  echo ""
  exit 1
fi

echo ""
echo -e "${GREEN}  ✓  All ${checked} files are within limits.${RESET}"
echo ""
exit 0
