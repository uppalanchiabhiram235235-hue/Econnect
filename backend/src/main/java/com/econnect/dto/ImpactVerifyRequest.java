package com.econnect.dto;

import com.econnect.entity.VerificationStatus;
import jakarta.validation.constraints.NotNull;

public record ImpactVerifyRequest(@NotNull VerificationStatus status) {
}
