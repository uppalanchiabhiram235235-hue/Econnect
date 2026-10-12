package com.econnect.dto;

import com.econnect.entity.ImpactType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ImpactRequest(
        @NotNull ImpactType impactType,
        @NotNull @DecimalMin("0.01") BigDecimal quantity,
        @NotBlank @Size(max = 30) String unit,
        @Size(max = 1000) String description) {
}
