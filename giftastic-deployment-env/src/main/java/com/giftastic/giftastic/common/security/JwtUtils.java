package com.giftastic.giftastic.common.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {
    private static final int MIN_SECRET_LENGTH = 64;

    private final SecretKey key;
    private final long expiration;

    public JwtUtils(
            @Value("${security.jwt.secret}") String secretString,
            @Value("${security.jwt.expiration-ms:86400000}") long expiration) {
        if (secretString == null || secretString.isBlank()) {
            throw new IllegalStateException("JWT_SECRET must be configured.");
        }
        if (secretString.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException("JWT_SECRET must be at least 64 characters.");
        }
        if (expiration <= 0) {
            throw new IllegalStateException("JWT_EXPIRATION_MS must be greater than 0.");
        }
        this.key = Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    public String generateToken(UserPrincipal principal) {
        return Jwts.builder()
                .subject(principal.getUserId().toString())
                .claim("email", principal.getEmail())
                .claim("supplierId", principal.getSupplierId())
                .claim("roles", principal.getAuthorities().stream().map(Object::toString).toList())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key) // Algorithm is inferred from the key type
                .compact();
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key) // Replaces setSigningKey
                .build()
                .parseSignedClaims(token) // Replaces parseClaimsJws
                .getPayload(); // Replaces getBody()
    }

    public boolean validate(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // Log this in a real app
            return false;
        }
    }
}
