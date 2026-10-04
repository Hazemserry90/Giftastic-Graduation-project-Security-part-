# Deployment and Operations

> For a complete, copy-paste walkthrough of provisioning an Ubuntu VM and
> installing Docker Engine, see [ubuntu-vm-docker.md](ubuntu-vm-docker.md).

## Prerequisites

- Docker Engine 24+ with Compose v2 (or Docker Desktop on Windows/macOS)
- 4 GB+ free RAM for the Wazuh indexer (6 GB+ recommended)
- Ports available on the host: `443`, `1514`, `1515`, `514/udp`, `55000`,
  `9200`, and optionally `2222`/`2223` for Cowrie
- A Linux host is recommended. The Wazuh images are Linux containers; on Windows
  they run under Docker Desktop's WSL2 backend.

## First-time setup

```bash
cd security-monitoring
cp .env.example .env
# Edit .env: change INDEXER_PASSWORD, DASHBOARD_PASSWORD and API_PASSWORD.
./scripts/init.sh
```

`init.sh` performs four steps:

1. Creates `.env` if it does not exist.
2. Creates `logs/giftastic` and `logs/cowrie`.
3. Generates the TLS certificates with the `generator` profile (one-time).
4. Starts `wazuh.indexer`, `wazuh.manager`, `wazuh.dashboard`, and Cowrie.

Without the script:

```bash
docker compose --profile certs run --rm generator
docker compose up -d
docker compose --profile cowrie up -d
```

## Changing default passwords

Wazuh's Docker images ship with demo credentials. Before exposing the lab to
anything, change them in `.env` **and** regenerate the matching bcrypt hash for
the indexer's internal users:

```bash
# Generate a hash for the new password
docker run --rm wazuh/wazuh-indexer:4.14.8 \
  bash -c '/usr/share/wazuh-indexer/plugins/opensearch-security/tools/hash.sh -p "NEW_PASSWORD"'
```

Put the resulting hash in `config/wazuh_indexer/internal_users.yml` for the
`admin` entry, update `INDEXER_PASSWORD`/`DASHBOARD_PASSWORD` in `.env`, and
update `config/wazuh_dashboard/wazuh.yml` if the API account changes.

## Ports

| Port | Service | Exposure |
| --- | --- | --- |
| 443 | Wazuh dashboard | Analyst UI over TLS |
| 55000 | Wazuh manager API | Automation/RBAC |
| 1514 | Agent enrollment/data | Agents only |
| 1515 | Agent enrollment | Agents only |
| 514/udp | Syslog collection | Optional |
| 9200 | Wazuh indexer | Internal |
| 2222 | Cowrie SSH | Decoy - internet-facing only if intentional |
| 2223 | Cowrie Telnet | Decoy |

## TLS certificates

Certificates are generated once into `config/wazuh_indexer_ssl_certs/`, which is
git-ignored. To rotate them:

```bash
rm -rf config/wazuh_indexer_ssl_certs/*
docker compose --profile certs run --rm generator
docker compose down && docker compose up -d
```

The certificate subject names are defined in `config/certs.yml` and must match
the `plugins.security.nodes_dn` and `authcz.admin_dn` entries in
`config/wazuh_indexer/wazuh.indexer.yml`.

## Operations

```bash
docker compose ps                       # status
docker compose logs -f wazuh.manager    # manager logs
docker compose logs -f wazuh.indexer    # indexer logs
docker compose down                     # stop
docker compose down -v                  # stop and delete all data volumes
```

Validate a rule or decoder interactively inside the manager:

```bash
docker compose exec wazuh.manager /var/ossec/bin/wazuh-logtest
```

Paste a sample JSON line (for example from
`../giftastic-deployment-env/logs/security-audit.log` or the simulation scripts)
and `wazuh-logtest` prints the matched rule and the generated alert.

Reload rules without restarting the manager:

```bash
docker compose exec wazuh.manager /var/ossec/bin/wazuh-control restart
```

## Resource planning

| Service | CPU | RAM |
| --- | --- | --- |
| Wazuh indexer | 2+ | 2-4 GB (JVM heap defaults to 1 GB) |
| Wazuh manager | 1+ | 1-2 GB |
| Wazuh dashboard | 1 | 1 GB |
| Cowrie | <1 | 256 MB |

On smaller machines, reduce `OPENSEARCH_JAVA_OPTS` in `docker-compose.yml` (for
example `-Xms512m -Xmx512m`) and expect slower dashboards.

## Backups

Alert and event history lives in the `wazuh-indexer-data` volume. Back up the
indexer with OpenSearch snapshots or by stopping the stack and archiving the
volume. Configuration and rules are all in Git, which is the source of truth.

## Troubleshooting

**Dashboard never becomes ready.** The indexer may still be starting or short on
memory. Check `docker compose logs wazuh.indexer` and `docker compose ps`.
Give it 1-3 minutes on first start.

**No events in the dashboard.** Confirm the log files exist and are non-empty
(`logs/giftastic/security-audit.log`, `logs/cowrie/cowrie.json`), that the
manager can read them (`docker compose exec wazuh.manager ls -l
/external-logs/`), and that the paths in
`config/wazuh_cluster/wazuh_manager.conf` match.

**Cowrie cannot write its log (Linux).** Cowrie runs as UID 999 and must be able
to write `logs/cowrie`. Fix with:

```bash
chmod -R a+rwX logs/cowrie
```

**Rules do not fire.** Run `wazuh-logtest` with a sample event and check for
decoder errors. Ensure the JSON is one object per line and that the file is
being appended (not rewritten in place).

**Agent not connecting.** Verify the agent's `<address>` is the manager host's
reachable IP or DNS name, that port 1514/tcp is open, and that the agent's
`/var/ossec/logs/ossec.log` shows a successful enrollment.

## Windows notes

- Run the setup from PowerShell (`.\scripts\init.ps1`).
- Bind mounts work through Docker Desktop; keep the repository on the Linux
  filesystem for better performance if you hit file-watching issues.
- The Wazuh **agent** for a Windows backend host is installed with the MSI and
  configured with `wazuh/agent/ossec-agent-windows.conf`.
