package com.econnect.dto;

public record LeaderboardEntryResponse(
        int rank,
        Long userId,
        String name,
        String level,
        int points,
        long eventsCompleted,
        double verifiedImpactTotal
) {
}
