#!/usr/bin/env bash
# Giftastic security monitoring lab - first-time setup.
#
# Generates the Wazuh TLS certificates, prepares the log directories, and
# starts the stack. Run from the security-monitoring directory:
#
#   ./scripts/init.sh            # start Wazuh + Cowrie
#   ./scripts/init.sh --wazuh    # start only the Wazuh stack
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed or not on PATH." >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "==> Creating .env from .env.example"
  cp .env.example .env
  echo "    Review security-monitoring/.env and change the passwords."
fi

echo "==> Creating log directories"
mkdir -p logs/giftastic logs/cowrie config/wazuh_indexer_ssl_certs

# Cowrie runs as UID 999 inside its container and writes cowrie.json here.
# On a Linux host the bind-mounted directory must be writable by that UID;
# Docker Desktop on Windows/macOS does not need this.
chmod -R a+rwX logs/cowrie

if [ ! -f config/wazuh_indexer_ssl_certs/admin.pem ]; then
  echo "==> Generating Wazuh TLS certificates (one-time)"
  docker compose --profile certs run --rm generator
else
  echo "==> TLS certificates already present, skipping generation"
fi

# logcollector only ingests regular files that already exist.
touch logs/giftastic/security-audit.log
touch logs/cowrie/cowrie.json

echo "==> Starting the Wazuh stack"
docker compose up -d wazuh.indexer wazuh.manager wazuh.dashboard

if [ "${1:-}" != "--wazuh" ]; then
  echo "==> Starting the Cowrie honeypot"
  docker compose --profile cowrie up -d cowrie
fi

cat <<'EOF'

The lab is starting. The Wazuh dashboard is available at:
    https://localhost
(accept the self-signed certificate; log in with the credentials in .env)

Allow 1-3 minutes for the indexer and dashboard to become ready. Then:
    ./scripts/simulate-giftastic.sh   # application-layer attack simulation
    ./scripts/simulate-cowrie.sh      # honeypot interaction
EOF
