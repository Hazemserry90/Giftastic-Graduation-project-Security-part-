# Residual Risk and Hardening

A monitoring lab improves visibility; it does not remove risk. This document
records what the lab deliberately leaves out and what must change before it is
used beyond coursework or controlled demonstrations.

## Lab-specific limitations

### Default credentials and self-signed TLS

The Wazuh images ship with demo users (`admin`, `kibanaserver`, `wazuh-wui`).
The lab keeps those defaults for reproducibility. Self-signed certificates mean
browsers and clients must bypass trust.

**Before any shared or networked use:**

- Rotate every password and regenerate the matching bcrypt hashes
  (see [deployment.md](deployment.md)).
- Replace the self-signed certificates with certificates from a trusted CA.
- Restrict the dashboard and indexer to an administrative network or VPN.

### Single-node, no high availability

`docker compose` runs one manager, one indexer, and one dashboard with no
replication. A host or container failure stops monitoring until it is restored.

**For production:** run the official multi-node Wazuh cluster (at least three
indexer nodes), back up the indexer, and monitor the monitoring stack itself.

### Single-host demo collapses trust boundaries

In the demo topology the manager reads bind-mounted host logs, so the host and
the SIEM share a failure domain. A compromised host could modify the log file
before the manager reads it.

**For production:** use Wazuh agents only. Agents buffer and forward events over
an encrypted channel, and the manager keeps its own copy. Consider shipping logs
to a second, independent sink.

### Ephemeral audit logs on the deployed backend

Giftastic is deployed to a platform where the container filesystem can be
replaced on redeploy. `logs/security-audit.log` will not survive a redeploy
unless a volume or forwarder is added. This limits forensic look-back.

**For production:** mount a persistent volume, stream the audit log to the
manager in near-real time, or write to a durable log service.

### No active response enabled

The rules classify and alert but do not block. The delivered
`wazuh_manager.conf` defines the standard active-response commands but leaves
active-response disabled.

**If enabling active response:** scope it tightly (for example, block only
repeated brute-force source IPs), allow-list internal ranges, test false-positive
behavior, and understand that blocking a shared NAT address can deny legitimate
users.

## Detection and data risks

### Account identifiers are personal data

`subject` contains an email address. It is necessary for identity correlation but
is personal data under privacy regimes such as GDPR.

**Mitigations already in place:** no passwords, tokens, request bodies, or
payment data are logged. **Additional steps:** set indexer retention, restrict
dashboard access by RBAC, and document the lawful basis for processing.

### False positives and alert fatigue

The brute-force and repeated-denial thresholds (8/120 s, 5/120 s, and so on) are
starting points, not tuned values. Legitimate automation, shared NAT, and
misconfigured clients can trigger them.

**Actions:** run the rules in alert-only mode during a baseline period, measure
false positives per rule, then tune frequencies, timeframes, or add suppression
for known-good sources.

### Log tampering and integrity

Application logs are plain files. An attacker with host access could delete or
alter them. Wazuh's own `alerts.log` is more resistant but still on the manager
host.

**For production:** forward to an append-only or remote sink, enable FIM on the
log directory, and consider log signing.

### Coverage is emission-dependent

Rules only detect events the application emits. Business-logic abuse that stays
within valid permissions, and tampering attempts that never reach an audited
branch, are not covered. Notably, the backend does not currently emit an event
when it rejects a client-submitted order total.

**Recommended instrumentation:** add `order.integrity.rejected`,
`payment.transition.rejected`, and `authorization.ownership.mismatch` events, and
write matching rules. This turns the financial-integrity review into an
automated, continuous control rather than a point-in-time audit.

## Honeypot risks

### Legal and ethical

Operating a honeypot is subject to local law and provider terms. Record only
what is needed for security analysis, avoid collecting third-party personal
data, and never let the decoy be used to attack others.

### No outbound access from the decoy

Cowrie is a decoy, not a sandbox. If it can make outbound connections, it could
be used as a pivot. The Compose service drops all capabilities and sets
`no-new-privileges`, but network egress should also be denied by a firewall or
network policy.

### Credential reuse

Never reuse real Giftastic credentials, SSH keys, or API tokens in the honeypot
configuration. The `userdb.txt` in this repository is intentionally fake.

## Operational hardening checklist

- [ ] Rotate all default passwords and replace self-signed certificates.
- [ ] Place the dashboard/indexer behind a VPN or administrative network.
- [ ] Use agents in production; remove the demo `localfile` bind mounts.
- [ ] Persist or forward the backend audit log.
- [ ] Tune rule thresholds after a baseline period.
- [ ] Configure indexer retention and skip backups.
- [ ] Restrict egress from the honeypot network segment.
- [ ] Add integrity monitoring on the log directories.
- [ ] Decide explicitly whether active response is in scope; if so, scope it.
- [ ] Add the missing financial/ownership instrumentation events.
- [ ] Review honeypot use against hosting terms and applicable law.

## What the lab does prove

Within its scope, the lab demonstrates that:

- Authentication failures, brute force, password spraying, authorization
  denials, and abuse-control violations produce correlated, severity-ranked
  alerts.
- Host and file-integrity signals can be joined with application events for
  context.
- A decoy service provides attacker behavior (credentials, commands, tooling,
  source IPs) that no real service should have to reveal.

That is the defensible claim. The lab is a monitoring capability, not a
guarantee that Giftastic is secure.
