# Giftastic Integration

This document describes what was added to the Giftastic backend to make it
observable by Wazuh, and how to forward that telemetry from a real host.

## Application changes

All application changes are additive and confined to the `common/security`
package and the logging configuration.

| File | Change |
| --- | --- |
| `common/security/SecurityAuditLogger.java` | New. Emits structured JSON security events to the `SECURITY_AUDIT` logger. Never throws. |
| `modules/identity/service/AuthService.java` | Logs `auth.login.success` / `auth.login.failure` around authentication. |
| `common/security/SecurityConfig.java` | Adds a JSON 401 entry point and JSON 403 access-denied handler that also log `authn.required` / `authz.access.denied`. |
| `common/security/BannedUserFilter.java` | Logs `authz.account.suspended` when a banned account is refused. |
| `common/security/RateLimitingFilter.java` | Logs `ratelimit.exceeded` when the process-local limiter blocks a client. |
| `src/main/resources/logback-spring.xml` | New. Routes the `SECURITY_AUDIT` logger to `logs/security-audit.log` with size/time rolling. |

The login path now looks like:

```java
try {
    auth = authManager.authenticate(...);
} catch (AuthenticationException ex) {
    auditLogger.loginFailure(email, ex.getClass().getSimpleName());
    throw ex;
}
...
auditLogger.loginSuccess(principal.getEmail());
```

`SecurityAuditLogger` resolves the client IP from `X-Forwarded-For`, then
`X-Real-IP`, then `request.getRemoteAddr()`, so the real source is captured
behind proxies and load balancers.

## Event schema

| Field | Meaning |
| --- | --- |
| `@timestamp` | Event time (ISO-8601 UTC) |
| `event_id` | Random UUID for the event |
| `event_type` | One of the event names below |
| `outcome` | `success`, `failure`, `denied`, or `blocked` |
| `subject` | Account identifier (email), or `null` when unknown |
| `source_ip` | Client IP (proxy-aware) |
| `method` | HTTP method |
| `path` | Request path |
| `reason` | Exception or control that produced the event |

Event types:

- `auth.login.success`
- `auth.login.failure`
- `authn.required`
- `authz.access.denied`
- `authz.account.suspended`
- `ratelimit.exceeded`

The logger never writes passwords, JWTs, request bodies, or payment data.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `SECURITY_AUDIT_LOG_FILE` | `logs/security-audit.log` | Destination of the JSON audit log |

On ephemeral hosts (for example Railway containers the backend is deployed to),
the filesystem is replaced on redeploy. Use a mounted volume or a sidecar log
forwarder if audit history must survive restarts.

## Verify locally

1. Start the backend (`mvnw spring-boot:run` from `giftastic-deployment-env`).
2. Attempt a bad login:

   ```bash
   curl -s -X POST http://localhost:8080/api/v1/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"nobody@example.com","password":"wrong"}'
   ```

3. Inspect the audit log:

   ```bash
   tail -n 5 ../logs/security-audit.log
   ```

   You should see a `auth.login.failure` event with `source_ip` and `reason`.

## Forward from a real host with a Wazuh agent

The single-host demo ingests the log by bind mount. For a real deployment,
install a Wazuh agent on the backend host and forward the same file.

### Linux

1. Add the Wazuh repository and install the agent (see the official Wazuh agent
   installation guide for your distribution).
2. Merge `wazuh/agent/ossec-agent-linux.conf` into `/var/ossec/etc/ossec.conf`.
3. Set `<address>` to the manager's reachable IP or DNS name.
4. Set the `location` paths to where the backend actually writes its logs.
5. Restart:

   ```bash
   sudo systemctl restart wazuh-agent
   sudo tail -f /var/ossec/logs/ossec.log
   ```

### Windows

1. Install the Wazuh agent MSI.
2. Merge `wazuh/agent/ossec-agent-windows.conf` into
   `C:\Program Files (x86)\ossec-agent\ossec.conf`.
3. Set `<address>` and the double-backslashed `location` paths.
4. Restart the `Wazuh` service.

The agent also performs file-integrity monitoring over the deployed application
path, so a change to a JAR, configuration file, or systemd unit becomes an
alert that can be correlated with application events.

## Run the rules without the backend

The `scripts/simulate-giftastic.*` scripts append the exact same JSON schema to
the audit log, which is the safe way to demonstrate detection coverage when the
backend is not running or must not be attacked. See
[demonstration.md](demonstration.md).
