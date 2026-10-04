package com.giftastic.giftastic.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws java.io.IOException, jakarta.servlet.ServletException {
        
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtUtils.validate(token)) {
                var claims = jwtUtils.getClaims(token);
                
                List<SimpleGrantedAuthority> authorities = ((List<String>) claims.get("roles")).stream()
                        .map(SimpleGrantedAuthority::new).toList();

                UserPrincipal principal = UserPrincipal.builder()
                        .userId(UUID.fromString(claims.getSubject()))
                        .supplierId(claims.get("supplierId") != null ? UUID.fromString(claims.get("supplierId").toString()) : null)
                        .email(claims.get("email", String.class))
                        .authorities(authorities)
                        .build();

                var auth = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        filterChain.doFilter(request, response);
    }
}