package com.giftastic.giftastic.common.security;

import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Emits structured, machine-readable security events to the dedicated
 * {@code SECURITY_AUDIT} logger.
 *
 * <p>The appender configured in {@code logback-spring.xml} writes these JSON
 * lines to {@code logs/security-audit.log}. The Wazuh agent installed on the
 * Giftastic host tails that file and forwards the events to the Wazuh manager,
 * where {@code giftastic_rules.xml} turns them into alerts.</p>
 *
 * <p>Auditing is best-effort: a failure here must never break request handling,
 * so every operation is defensive and exceptions are swallowed.</p>
 */
@Component
public class SecurityAuditLogger {

    public static final String LOGGER_NAME = "SECURITY_AUDIT";

    private static final Logger AUDIT = LoggerFactory.getLogger(LOGGER_NAME);

    /** Emitted after a successful password authentication. */
    public void loginSuccess(String email) {
        write("auth.login.success", "success", email, null, currentRequest());
    }

    /** Emitted when password authentication fails (unknown user or bad password). */
    public void loginFailure(String email, String reason) {
        HttpServletRequest request = currentRequest();
        write("auth.login.failure", "failure", email, reason, request);
    }

    /** Emitted when an authenticated principal is denied a protected operation. */
    public void accessDenied(HttpServletRequest request, String principal, String reason) {
        write("authz.access.denied", "denied", principal, reason, request);
    }

    /** Emitted when a request reaches a protected resource without valid authentication. */
    public void authenticationRequired(HttpServletRequest request, String reason) {
        write("authn.required", "denied", null, reason, request);
    }

    /** Emitted when the process-local rate limiter blocks a client. */
    public void rateLimitExceeded(HttpServletRequest request) {
        write("ratelimit.exceeded", "blocked", null, "too_many_requests", request);
    }

    /** Emitted when a banned/suspended account is refused access. */
    public void suspendedAccount(HttpServletRequest request, String principal) {
        write("authz.account.suspended", "blocked", principal, "banned_user", request);
    }

    private void write(String eventType, String outcome, String subject, String reason,
                       HttpServletRequest request) {
        try {
            String ip = clientIp(request);
            String path = request != null ? request.getRequestURI() : null;
            String method = request != null ? request.getMethod() : null;

            StringBuilder json = new StringBuilder(256);
            json.append('{')
                .append("\"@timestamp\":\"").append(Instant.now()).append("\",")
                .append("\"event_id\":\"").append(UUID.randomUUID()).append("\",")
                .append("\"event_type\":\"").append(escape(eventType)).append("\",")
                .append("\"outcome\":\"").append(escape(outcome)).append("\",")
                .append("\"subject\":").append(quotedOrNull(subject)).append(',')
                .append("\"source_ip\":").append(quotedOrNull(ip)).append(',')
                .append("\"method\":").append(quotedOrNull(method)).append(',')
                .append("\"path\":").append(quotedOrNull(path)).append(',')
                .append("\"reason\":").append(quotedOrNull(reason))
                .append('}');

            AUDIT.info(json.toString());
        } catch (Exception ignored) {
            // Auditing must never interfere with the request it observes.
        }
    }

    private static HttpServletRequest currentRequest() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (attributes instanceof ServletRequestAttributes servletAttributes) {
            return servletAttributes.getRequest();
        }
        return null;
    }

    /**
     * Resolves the client IP, preferring the left-most forwarded-for entry so the
     * real source is captured when Giftastic sits behind a proxy or load balancer.
     */
    private static String clientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    private static String quotedOrNull(String value) {
        return value == null ? "null" : "\"" + escape(value) + "\"";
    }

    private static String escape(String value) {
        StringBuilder out = new StringBuilder(value.length() + 16);
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
                }
            }
        }
        return out.toString();
    }
}
