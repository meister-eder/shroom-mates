#!/usr/bin/env bash
# Kompakte Prüfung für Menschen und Agenten: gibt pro Schritt nur PASS/FAIL aus,
# bei FAIL die relevanten Fehlerzeilen (spart Kontext). Exit-Code != 0 bei Fehler.
#
#   scripts/verify.sh            # = quick
#   scripts/verify.sh quick      # lint + build aller Workspaces (apps/*, packages/*)
#   scripts/verify.sh visual     # quick + Screenshot-Vergleich gegen Baseline (e2e/visual)
#   scripts/verify.sh backend    # Medusa-Unit-Tests (npm ci bei Bedarf)
#   scripts/verify.sh all        # quick + visual + backend
#   scripts/verify.sh baseline   # Screenshot-Baseline neu erzeugen (nur bewusst!)
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/.verify-logs"
mkdir -p "$LOG_DIR"
MODE="${1:-quick}"
FAILED=0

# Storefront/Web-Build braucht eine Backend-URL; lokal ist das der Medusa-Mock.
export PUBLIC_MEDUSA_BACKEND_URL="${PUBLIC_MEDUSA_BACKEND_URL:-http://localhost:9010}"
export ASTRO_TELEMETRY_DISABLED=1

step() {
	local name="$1"
	shift
	local log="$LOG_DIR/$name.log"
	local start=$SECONDS
	if (cd "$ROOT" && "$@") >"$log" 2>&1; then
		echo "PASS $name ($((SECONDS - start))s)"
	else
		echo "FAIL $name ($((SECONDS - start))s) — full log: .verify-logs/$name.log"
		# Fehlerzeilen zuerst, sonst das Ende des Logs
		grep -nE "error|Error|ERR!|✘|×|FAIL|failed|Diff|did not match|expected" "$log" | grep -vE "0 errors|errors: 0" | head -40 ||
			true
		echo "--- tail ---"
		tail -n 15 "$log"
		FAILED=1
	fi
}

lint_all() { bun run --filter '*' lint; }
build_all() { bun run build; }

backend_tests() {
	cd backend || return 1
	[ -d node_modules ] || npm ci --no-audit --no-fund --cache /tmp/npm-cache-sm || return 1
	npm run test:unit
}

visual() {
	cd e2e || return 1
	[ -d node_modules ] || bun install || return 1
	if [ ! -d visual/__screenshots__ ]; then
		echo "Keine Baseline in e2e/visual/__screenshots__ — erst 'scripts/verify.sh baseline' auf dem Ausgangsstand laufen lassen."
		return 1
	fi
	npx playwright test -c visual/playwright.config.ts
}

baseline() {
	cd e2e || return 1
	[ -d node_modules ] || bun install || return 1
	npx playwright test -c visual/playwright.config.ts --update-snapshots
}

case "$MODE" in
quick)
	step lint lint_all
	step build build_all
	;;
visual)
	step lint lint_all
	step build build_all
	[ $FAILED -eq 0 ] && step visual visual
	;;
backend)
	step backend backend_tests
	;;
all)
	step lint lint_all
	step build build_all
	[ $FAILED -eq 0 ] && step visual visual
	step backend backend_tests
	;;
baseline)
	step build build_all
	[ $FAILED -eq 0 ] && step baseline baseline
	;;
*)
	echo "Unbekannter Modus: $MODE (quick|visual|backend|all|baseline)"
	exit 2
	;;
esac

exit $FAILED
