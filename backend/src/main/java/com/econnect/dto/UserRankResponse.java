package com.econnect.dto;

public record UserRankResponse(
        Integer rank,
        int points,
        Integer pointsToNext,
        long totalRanked
) {
}
