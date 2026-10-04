package com.giftastic.giftastic.common.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Required for @PreAuthorize to work
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtUtils jwtUtils;
    private final BannedUserFilter bannedUserFilter;
    private final SecurityAuditLogger auditLogger;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Returns a uniform JSON 401 for unauthenticated requests and records the event
     * for the SIEM instead of leaking a framework default error page.
     */
    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            auditLogger.authenticationRequired(request, authException.getClass().getSimpleName());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"Unauthorized\",\"message\":\"Authentication is required to access this resource.\"}");
        };
    }

    /**
     * Returns a uniform JSON 403 for authenticated-but-unauthorized operations and
     * records the denial, which is how privilege-bypass attempts surface in Wazuh.
     */
    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            UserPrincipal principal = SecurityUtils.getPrincipal();
            String subject = principal != null ? principal.getEmail() : null;
            auditLogger.accessDenied(request, subject, accessDeniedException.getClass().getSimpleName());
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"Forbidden\",\"message\":\"You do not have permission to perform this action.\"}");
        };
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        configuration.setAllowedOrigins(java.util.Arrays.asList("http://localhost:3000"));
        configuration.setAllowedMethods(java.util.Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint())
                .accessDeniedHandler(accessDeniedHandler())
            )
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/orders/guest-checkout").permitAll()
                .requestMatchers("/api/v1/orders/guest-track/**").permitAll()
                .requestMatchers("/api/v1/payment/**").permitAll()
                .requestMatchers("/api/v1/users/profile/**").permitAll()
                .requestMatchers("/api/v1/delivery/zones").permitAll()
                .requestMatchers("/api/v1/delivery/cost").permitAll()
                .requestMatchers("/api/v1/search").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/products/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/products/search").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/categories/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/flows/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/vendors/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/reviews/entity/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/recommendations/trending").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/recommendations/similar/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/recommendations/by-tags").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/recommendations/engine-info").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/recommendations/product-of-the-day").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/recommendations/vendor-of-the-day").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/recommendations/flow-of-the-day").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/recommendations/most-frequently-bought").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/recommendations/what-others-are-buying").permitAll()
                // Everything else handled by @PreAuthorize on controllers
                .anyRequest().authenticated()
            )
            // Add banned user filter after JWT authentication
            .addFilterBefore(new JwtAuthenticationFilter(jwtUtils), UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(bannedUserFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler(DomainPermissionEvaluator evaluator) {
        DefaultMethodSecurityExpressionHandler expressionHandler = new DefaultMethodSecurityExpressionHandler();
        expressionHandler.setPermissionEvaluator(evaluator);
        return expressionHandler;
    }
}
