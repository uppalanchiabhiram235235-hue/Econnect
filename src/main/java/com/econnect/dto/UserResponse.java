package com.econnect.dto;

import com.econnect.entity.Role;
import com.econnect.entity.User;

public record UserResponse(Long id, String name, String email, String phone, String location,
                           Role role, int points, String level) {

    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getLocation(),
                u.getRole(), u.getPoints(), u.getLevel().getLabel());
    }
}
