package com.giftastic.giftastic.common.security;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.giftastic.giftastic.modules.user.domain.User;
import com.giftastic.giftastic.modules.user.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class BannedUserFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final SecurityAuditLogger auditLogger;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain)
            throws ServletException, IOException {
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // Skip filter for unauthenticated requests or public endpoints
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get user ID from authentication
        java.util.UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check if user is banned
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && user.isBanned()) {
            auditLogger.suspendedAccount(request, user.getEmail());
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Account suspended\",\"message\":\"Your account has been banned. Please contact support.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
