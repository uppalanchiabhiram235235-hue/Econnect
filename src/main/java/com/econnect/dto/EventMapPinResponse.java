package com.econnect.dto;

import com.econnect.entity.EventStatus;
import com.econnect.entity.EventType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EventMapPinResponse(
        Long id,
        String title,
        EventType eventType,
        String eventTypeLabel,
        BigDecimal latitude,
        BigDecimal longitude,
        LocalDate eventDate,
        EventStatus status,
        long remainingSlots
) {
}
