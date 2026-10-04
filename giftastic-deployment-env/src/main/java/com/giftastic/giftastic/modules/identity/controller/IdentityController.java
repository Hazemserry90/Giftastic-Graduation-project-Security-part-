package com.giftastic.giftastic.modules.identity.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.modules.identity.dto.AuthResponse;
import com.giftastic.giftastic.modules.identity.dto.LoginRequest;
import com.giftastic.giftastic.modules.identity.dto.RegisterRequest;
import com.giftastic.giftastic.modules.identity.service.AuthService;
import com.giftastic.giftastic.modules.identity.service.IdentityServiceImpl;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication and registration endpoints")
public class IdentityController {

    private final IdentityServiceImpl identityService;
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        identityService.register(request.name(), request.email(), request.password());
        // Auto-login after successful registration
        AuthResponse authResponse = authService.login(request.email(), request.password());
        return ResponseEntity.status(201).body(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request.email(), request.password()));
    }
}