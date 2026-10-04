package com.giftastic.giftastic.common.security;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private final SecurityAuditLogger auditLogger;

    private final ConcurrentHashMap<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> lastRequestReset = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 800;
    private static final long RESET_INTERVAL_MILLIS = 60000;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = request.getRemoteAddr();
        long now = System.currentTimeMillis();

        lastRequestReset.putIfAbsent(clientIp, now);
        if (now - lastRequestReset.get(clientIp) > RESET_INTERVAL_MILLIS) {
            requestCounts.remove(clientIp);
            lastRequestReset.put(clientIp, now);
        }

        requestCounts.putIfAbsent(clientIp, new AtomicInteger(0));
        int count = requestCounts.get(clientIp).incrementAndGet();

        if (count > MAX_REQUESTS_PER_MINUTE) {
            auditLogger.rateLimitExceeded(request);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests from this IP. Please try again later.");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
