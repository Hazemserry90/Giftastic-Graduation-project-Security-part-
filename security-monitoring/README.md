# Giftastic Security Monitoring Lab

A defense-in-depth monitoring lab that connects the Giftastic application to a
**Wazuh** SIEM and a **Cowrie** SSH/Telnet honeypot. It collects and correlates:

- Giftastic authentication and authorization events (login success/failure,
  access denials, token failures, rate-limit violations, suspended accounts)
- Host and file-integrity signals from the Wazuh agent
- Attacker behavior against a decoy service (credentials tried, commands run,
  files downloaded, sessions)

The lab is designed to run on a single Docker host for coursework and
demonstrations. It never touches production Giftastic services or real
customer, payment, or credential data.

> **Lab only.** Default credentials are well known and several ports are
> published. Run it on an isolated host or lab network and never expose it to
> the internet.

## Architecture

```text
                         +---------------------------- Wazuh manager ----------------------------+
                         |  analysisd (decoders + rules)          filebeat  ->  Wazuh indexer     |
                         |  remoted (agent enrollment)             Wazuh API (:55000)             |
                         +-------------^------------------------------^--------------+------------+
                                       |                              |              |
            JSON audit events          |        agent events          |              |  alerts
   +----------------------------+      |   +--------------------+     |              v
   | Giftastic Spring Boot      |      |   | Wazuh agent        |     |     +---------------------+
   | SecurityAuditLogger        |------+   | (app or cowrie     |-----+     | Wazuh dashboard     |
   | -> logs/security-audit.log |  file    |  host)              |            | https://localhost   |
   +----------------------------+ collector +--------------------+            +---------------------+
                                                                                        ^
   +----------------------------+                                                        |
   | Cowrie honeypot            |  JSON sessions / credentials / commands  --------------+
   | cowrie.json                |
   +----------------------------+
```

The Docker Compose stack runs the Wazuh manager, indexer, and dashboard. Cowrie
runs as an optional profile. The Giftastic backend is **not** containerized by
this lab: it runs wherever it already runs, and a Wazuh agent (or a bind mount in
the demo topology) forwards its audit log.

See [docs/architecture.md](docs/architecture.md) for the full data-flow and
deployment topology.

## Components

| Component | Purpose | Where |
| --- | --- | --- |
| Wazuh manager | Decodes events, matches rules, raises alerts, manages agents | `docker-compose.yml` |
| Wazuh indexer | Stores alerts and events | `docker-compose.yml` |
| Wazuh dashboard | Analyst UI, rule/alert triage | `https://localhost` |
| Wazuh agent | Forwards Giftastic host logs and file-integrity data | `wazuh/agent/` |
| Giftastic audit logger | Emits structured JSON security events | `giftastic-deployment-env/.../SecurityAuditLogger.java` |
| Giftastic rules | Application detections (auth, authz, abuse) | `wazuh/rules/giftastic_rules.xml` |
| Cowrie honeypot | Decoy SSH/Telnet service | `cowrie/` |
| Cowrie rules | Honeypot detections (brute force, commands, downloads) | `wazuh/rules/cowrie_rules.xml` |

## Quick start

Prerequisites: Docker Engine with Compose v2 on a Linux/macOS host (or Docker
Desktop). Give the indexer at least 4 GB of RAM.

```bash
cd security-monitoring
cp .env.example .env              # then change the passwords
./scripts/init.sh                 # generates certs and starts Wazuh + Cowrie
```

On Windows:

```powershell
cd security-monitoring
Copy-Item .env.example .env
.\scripts\init.ps1
```

Then open `https://localhost` (accept the self-signed certificate) and log in
with the credentials from `.env`.

### Run a demonstration

```bash
./scripts/simulate-giftastic.sh   # application-layer attack simulation
./scripts/simulate-cowrie.sh      # honeypot interaction (live if sshpass, else synthetic)
```

In the dashboard, filter on `rule.groups: giftastic` and `rule.groups: cowrie`.

See [docs/demonstration.md](docs/demonstration.md) for a timed walkthrough.

## Connecting real Giftastic telemetry

1. The backend already emits the audit log through
   `SecurityAuditLogger` and the `SECURITY_AUDIT` appender in
   `logback-spring.xml`. Events land in `logs/security-audit.log` by default.
2. On the host running the backend, install a Wazuh agent and merge
   `wazuh/agent/ossec-agent-linux.conf` (or `-windows.conf`) into the agent's
   `ossec.conf`.
3. Point the agent's `<address>` at the manager and restart the agent.

Full instructions: [docs/giftastic-integration.md](docs/giftastic-integration.md).

## What is detected

| Rule | Level | Detects |
| --- | --- | --- |
| 100201 | 3 | Successful login |
| 100210 | 5 | Failed login |
| 100211 | 10 | Brute force / credential stuffing from one IP |
| 100212 | 12 | Password spraying across source IPs |
| 100220 | 7 | Authorization denied |
| 100221 | 10 | Repeated denials (privilege probing / IDOR) |
| 100260 | 12 | Denial on a sensitive admin/financial path |
| 100230 | 3 | Protected resource accessed without valid auth |
| 100231 | 9 | Repeated unauthenticated access |
| 100240 | 6 | Rate limit exceeded |
| 100241 | 10 | Repeated rate-limit violations |
| 100250 | 10 | Suspended account access attempt |
| 100300-100313 | 3-10 | Cowrie sessions, failed/successful logins, brute force |
| 100320-100330 | 8-12 | Attacker commands, downloads, persistence, credential access |

Full mapping, including MITRE ATT&CK and thesis findings: see
[docs/detection-coverage.md](docs/detection-coverage.md).

## Documentation

- [Architecture and data flow](docs/architecture.md)
- [Ubuntu VM + Docker Engine setup](docs/ubuntu-vm-docker.md)
- [Deployment and operations](docs/deployment.md)
- [Giftastic integration](docs/giftastic-integration.md)
- [Detection coverage](docs/detection-coverage.md)
- [Demonstration timeline](docs/demonstration.md)
- [Residual risk and hardening](docs/residual-risk.md)

## Directory layout

```text
security-monitoring/
├── docker-compose.yml              # Wazuh stack + optional Cowrie
├── .env.example                    # lab secrets template
├── config/                         # Wazuh indexer/dashboard/manager configuration
├── wazuh/
│   ├── rules/                      # Giftastic and Cowrie detection rules
│   └── agent/                      # agent config for Giftastic hosts
├── cowrie/
│   └── etc/                        # honeypot config and fake credentials
├── scripts/                        # setup and attack-simulation scripts
└── docs/                           # architecture, coverage, demonstration, risk
```
