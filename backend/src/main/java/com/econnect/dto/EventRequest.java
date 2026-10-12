package com.econnect.dto;

import com.econnect.entity.EventStatus;
import com.econnect.entity.EventType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record EventRequest(
        @NotBlank @Size(max = 150) String title,
        @Size(max = 2000) String description,
        @NotNull EventType eventType,
        @NotBlank @Size(max = 200) String location,
        @NotNull LocalDate eventDate,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @NotNull @Min(1) Integer maxVolunteers,
        @Min(1) Integer requiredVolunteers,
        @Size(max = 2000) String objectives,
        EventStatus status,
        @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude) {
}
