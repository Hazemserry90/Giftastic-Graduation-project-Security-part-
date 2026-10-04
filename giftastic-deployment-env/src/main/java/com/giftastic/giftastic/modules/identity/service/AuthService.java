package com.giftastic.giftastic.modules.identity.service;

import com.giftastic.giftastic.common.security.JwtUtils;
import com.giftastic.giftastic.common.security.SecurityAuditLogger;
import com.giftastic.giftastic.common.security.UserPrincipal;
import com.giftastic.giftastic.modules.identity.dto.AuthResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authManager;
    private final JwtUtils jwtUtils;
    private final SecurityAuditLogger auditLogger;

    public AuthResponse login(String email, String password) {
        Authentication auth;
        try {
            auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
        } catch (AuthenticationException ex) {
            // Failed logins are a primary intrusion signal and must reach the SIEM.
            auditLogger.loginFailure(email, ex.getClass().getSimpleName());
            throw ex;
        }

        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        String token = jwtUtils.generateToken(principal);

        auditLogger.loginSuccess(principal.getEmail());

        // Extract roles as strings
        java.util.List<String> roles = principal.getAuthorities().stream()
                .map(Object::toString)
                .toList();

        // Determine primary role
        String primaryRole = roles.stream()
                .filter(r -> r.startsWith("ROLE_"))
                .findFirst()
                .map(r -> r.replace("ROLE_", ""))
                .orElse("CUSTOMER");

        // Build user info
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                principal.getUserId(),
                principal.getEmail(),
                principal.getSupplierId(),
                roles,
                primaryRole
        );

        return new AuthResponse(token, principal.getEmail(), principal.getUserId(), userInfo);
    }
}
