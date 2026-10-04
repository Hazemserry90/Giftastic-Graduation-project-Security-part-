package com.giftastic.giftastic.common.security;

import java.util.UUID;

import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    public static UserPrincipal getPrincipal() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            return null;
        }
        return (UserPrincipal) auth.getPrincipal();
    }

    public static UUID getCurrentUserId() {
        UserPrincipal principal = getPrincipal();
        return principal != null ? principal.getUserId() : null;
    }

    public static UUID getCurrentSupplierId() {
        UserPrincipal principal = getPrincipal();
        return principal != null ? principal.getSupplierId() : null;
    }

    public static boolean hasAuthority(String authority) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(authority));
    }
}