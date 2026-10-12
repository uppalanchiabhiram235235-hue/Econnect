package com.econnect.dto;

import java.math.BigDecimal;
import java.util.List;

public record UserStatistics(
        Long userId, int points, String level, String nextLevel, Integer pointsToNextLevel,
        long eventsJoined, long eventsCompleted, BigDecimal verifiedImpact,
        List<BadgeResponse> badges,
        List<ParticipationResponse> recentActivities,
        List<ParticipationResponse> upcomingEvents) {
}
