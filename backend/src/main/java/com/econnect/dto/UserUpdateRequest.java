package com.econnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 20) String phone,
        @Size(max = 150) String location) {
}
