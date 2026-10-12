package com.econnect.controller;

import com.econnect.dto.LoginRequest;
import com.econnect.dto.RegisterRequest;
import com.econnect.dto.UserResponse;
import com.econnect.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return auth.register(request);
    }

    /** Validates credentials and returns the profile. Send the same credentials as HTTP Basic afterwards. */
    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest request) {
        return auth.login(request);
    }
}
