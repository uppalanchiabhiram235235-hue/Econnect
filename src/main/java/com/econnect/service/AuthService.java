package com.econnect.service;

import com.econnect.dto.LoginRequest;
import com.econnect.dto.RegisterRequest;
import com.econnect.dto.UserResponse;
import com.econnect.entity.User;
import com.econnect.exception.BusinessRuleException;
import com.econnect.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public AuthService(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Transactional
    public UserResponse register(RegisterRequest r) {
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new BusinessRuleException("An account with this email already exists");
        }
        User u = new User();
        u.setName(r.name().trim());
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(r.password()));
        u.setPhone(r.phone());
        u.setLocation(r.location());
        u.setRole(r.role());
        return UserResponse.from(users.save(u));
    }

    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest r) {
        User u = users.findByEmail(r.email().trim().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!encoder.matches(r.password(), u.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        return UserResponse.from(u);
    }
}
