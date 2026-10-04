# Detection Coverage

This document maps every custom rule to its telemetry source, severity, MITRE
ATT&CK technique, and the Giftastic security concern it helps detect.

## Severity model

Rule levels follow the Wazuh convention (0-15). The lab groups them as:

| Level | Meaning | Examples |
| --- | --- | --- |
| 0-3 | Informational / normal activity | Successful login, session connect |
| 4-7 | Suspicious | Single failed login, rate limit, single denial |
| 8-11 | High | Brute force, repeated denials, attacker commands, downloads |
| 12-15 | Critical | Sensitive-path denial, password spraying, persistence |

## Giftastic application rules

Source: `logs/security-audit.log` (JSON) -> built-in `json` decoder.

| Rule | Level | Detects | Correlation | MITRE |
| --- | --- | --- | --- | --- |
| 100200 | 0 | Any Giftastic audit event (base) | - | - |
| 100201 | 3 | Successful login | - | T1078 |
| 100210 | 5 | Failed login | - | T1110 |
| 100211 | 10 | Brute force / credential stuffing | 8 failures / 120 s, same `source_ip` | T1110 |
| 100212 | 12 | Password spraying | 8 failures / 300 s, same `subject`, different `source_ip` | T1110 |
| 100220 | 7 | Authorization denied | - | T1548 |
| 100221 | 10 | Repeated denials (privilege probing / IDOR) | 5 / 120 s, same `subject` | T1548 |
| 100260 | 12 | Denial on a sensitive path | Path regex | T1548 |
| 100230 | 3 | Protected resource without valid auth | - | T1190 |
| 100231 | 9 | Repeated unauthenticated access | 10 / 120 s, same `source_ip` | T1190 |
| 100240 | 6 | Rate limit exceeded | - | - |
| 100241 | 10 | Repeated rate-limit violations | 5 / 300 s, same `source_ip` | T1190 |
| 100250 | 10 | Suspended account access attempt | - | - |

### Sensitive paths (rule 100260)

Rule 100260 matches the `path` field against a regex covering administrative,
permission, commission, payment, order, and vendor endpoints. Denials on these
paths are raised to critical because they are more likely to indicate a
deliberate authorization bypass than a normal user mistake.

## Cowrie honeypot rules

Source: `cowrie.json` (JSON) -> built-in `json` decoder.

| Rule | Level | Detects | Correlation | MITRE |
| --- | --- | --- | --- | --- |
| 100300 | 0 | Any Cowrie event (base) | - | - |
| 100301 | 3 | SSH/Telnet connection | - | T1595 |
| 100302 | 3 | Session closed | - | - |
| 100310 | 6 | Failed honeypot login | - | T1110 |
| 100311 | 9 | Successful honeypot login | - | T1078 |
| 100312 | 10 | Brute force | 6 failures / 120 s, same `src_ip` | T1110 |
| 100313 | 10 | Password spraying | 5 / 300 s, same `username`, different `src_ip` | T1110 |
| 100320 | 8 | Attacker command executed | - | T1059 |
| 100321 | 12 | Payload download / channel (`wget`, `curl`, `nc`, ...) | regex on `input` | T1105 |
| 100322 | 10 | Permission/attribute changes | regex on `input` | T1222 |
| 100323 | 12 | Persistence attempt (`crontab`, `systemctl`, ...) | regex on `input` | T1053 |
| 100324 | 12 | Credential/secret discovery (`/etc/shadow`, `.ssh/`, ...) | regex on `input` | T1552 |
| 100330 | 12 | File transfer from attacker | - | T1105 |

## Host and file-integrity coverage

Provided by the Wazuh agent (not custom rules):

- **FIM (`syscheck`)** - real-time changes under the deployed application path
  and systemd unit directory (Linux) or application directory (Windows).
- **auditd / Windows Security channel** - account changes and privileged
  process activity.
- **SCA** and **rootcheck** - configuration and rootkit baseline.
- **Vulnerability detection** - package exposure for the agent host.

## Mapping to the Giftastic audit themes

| Audit theme | Primary detections |
| --- | --- |
| Authentication and token handling | 100210, 100211, 100212, 100230, 100231 |
| Authorization and privilege bypass | 100220, 100221, 100260 |
| Sensitive-data exposure | FIM on app artifacts, 100250, sensitive-path denials |
| Input validation / injection surface | 100230/100231 (scanning), Cowrie command rules |
| Financial workflow integrity | 100260 on commission/payment paths, 100221 repeated denials |
| Deployment and secrets | FIM on configuration, SCA, host audit rules |

## Coverage gaps

Rules can only detect events that are emitted or collected. The current design
does not automatically detect:

- Client-side price/commission tampering unless the backend records a rejected
  or corrected total. Add an `order.integrity.rejected` event if the server
  rejects a client-submitted total.
- Business-logic abuse that stays within valid endpoints and permissions.
- Attacks that never touch the decoy, the host, or the audited endpoints
  (for example, purely data-at-rest access).

These are documented in [residual-risk.md](residual-risk.md) and are candidates
for additional instrumentation rather than for changing the rules.

## Extending the ruleset

1. Add an event in `SecurityAuditLogger` with a new `event_type`.
2. Add a rule in `wazuh/rules/giftastic_rules.xml` under the base rule 100200.
3. Choose the next free rule id in the `1002xx` range.
4. Validate with `wazuh-logtest` before committing.
5. Update this document and, if needed, the sensitive-path regex in rule 100260.
