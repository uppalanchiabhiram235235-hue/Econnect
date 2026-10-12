package com.econnect.dto;

import com.econnect.entity.EventStatus;
import com.econnect.entity.EventType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record EventResponse(
        Long id, String title, String description, EventType eventType, String eventTypeLabel,
        String location, LocalDate eventDate, LocalTime startTime, LocalTime endTime,
        int maxVolunteers, int requiredVolunteers, String objectives, EventStatus status,
        Long organizerId, String organizerName,
        long currentParticipants, long remainingSlots,
        String myParticipationStatus,
        List<ImpactResponse> verifiedImpact,
        BigDecimal latitude, BigDecimal longitude, Double distanceKm) {
}
