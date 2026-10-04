# Cowrie Honeypot

Cowrie is a low-interaction SSH and Telnet honeypot. In this lab it acts as the
decoy layer: it accepts attacker connections, records the credentials they try
and the commands they run, and never touches a real system.

## Configuration

- `etc/cowrie.cfg` - operator overrides. The image ships sane defaults; this
  file sets the decoy hostname, enables JSON output to
  `var/log/cowrie/cowrie.json`, and enables the text log.
- `etc/userdb.txt` - fake credential store. Rejects a few obvious passwords so
  failed logins are recorded, then accepts the rest to keep attackers in the
  session long enough to observe their tooling.

Both files are bind-mounted into `/cowrie/cowrie-git/etc` by
`../docker-compose.yml` under the `cowrie` profile.

## Run

```bash
cd ..
docker compose --profile cowrie up -d cowrie
docker compose --profile cowrie logs -f cowrie
```

Ports: `2222` -> SSH decoy, `2223` -> Telnet decoy (host ports configurable with
`COWRIE_SSH_PORT` / `COWRIE_TELNET_PORT`).

## Events

Cowrie writes one JSON object per event to `../logs/cowrie/cowrie.json`, which
the Wazuh manager ingests and matches with `../wazuh/rules/cowrie_rules.xml`.
Key event IDs are `cowrie.session.connect`, `cowrie.login.failed`,
`cowrie.login.success`, `cowrie.command.input`,
`cowrie.session.file_download`, and `cowrie.session.closed`.

## Safety

- The container drops all capabilities and sets `no-new-privileges`.
- Deny the container network egress so the decoy cannot be used as a pivot.
- Never reuse real credentials, keys, or tokens in `userdb.txt`.
- Do not expose the decoy ports to the public internet without understanding the
  legal and operational implications.

See [../docs/residual-risk.md](../docs/residual-risk.md) for the full honeypot
risk discussion.
