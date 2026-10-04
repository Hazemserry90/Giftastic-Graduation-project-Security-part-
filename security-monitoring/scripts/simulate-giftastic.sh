#!/usr/bin/env bash
# Simulate Giftastic application-layer attacks by appending events to the
# security audit log exactly as the backend's SecurityAuditLogger would.
#
# This drives every custom Giftastic rule without touching a live system, which
# is the safe way to demonstrate detection coverage during a thesis defense.
#
#   ./scripts/simulate-giftastic.sh [path-to-log]
set -euo pipefail

cd "$(dirname "$0")/.."
LOG="${1:-logs/giftastic/security-audit.log}"
mkdir -p "$(dirname "$LOG")"
touch "$LOG"

now() { date -u +"%Y-%m-%dT%H:%M:%S.000Z"; }

# emit <event_type> <outcome> <subject> <source_ip> <method> <path> <reason>
emit() {
  local id
  id="$(cat /proc/sys/kernel/random/uuid 2>/dev/null || printf '%04x%04x-0000-4000-8000-%012x' "$RANDOM" "$RANDOM" "$RANDOM")"
  printf '{"@timestamp":"%s","event_id":"%s","event_type":"%s","outcome":"%s","subject":"%s","source_ip":"%s","method":"%s","path":"%s","reason":"%s"}\n' \
    "$(now)" "$id" "$1" "$2" "$3" "$4" "$5" "$6" "$7" >> "$LOG"
}

echo "==> Simulating failed logins (brute force) from 203.0.113.10"
for _ in $(seq 1 10); do
  emit auth.login.failure failure victim@giftastic.example 203.0.113.10 POST /api/v1/auth/login BadCredentialsException
  sleep 0.2
done

echo "==> Simulating a successful login"
emit auth.login.success success customer@giftastic.example 198.51.100.7 POST /api/v1/auth/login ""

echo "==> Simulating authorization probing (IDOR / privilege escalation)"
for _ in $(seq 1 6); do
  emit authz.access.denied denied vendor@giftastic.example 203.0.113.44 PUT /api/v1/admin/permissions AccessDeniedException
  sleep 0.2
done
emit authz.access.denied denied vendor@giftastic.example 203.0.113.44 GET /api/v1/commissions AccessDeniedException

echo "==> Simulating unauthenticated access to protected resources"
for _ in $(seq 1 12); do
  emit authn.required denied none 192.0.2.55 GET /api/v1/orders/ AdminAuthenticationException
  sleep 0.2
done

echo "==> Simulating rate-limit violations from one source"
for _ in $(seq 1 6); do
  emit ratelimit.exceeded blocked none 192.0.2.99 POST /api/v1/auth/login too_many_requests
  sleep 0.2
done

echo "==> Simulating a suspended account attempting access"
emit authz.account.suspended blocked banned@giftastic.example 198.51.100.23 GET /api/v1/orders BannedUserException

echo
echo "Wrote simulated events to $LOG"
echo "Open the Wazuh dashboard (https://localhost) and filter on rule.groups: giftastic"
