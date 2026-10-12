package com.econnect.dto;

import java.math.BigDecimal;

public record CommunityImpact(long totalVolunteers, long eventsCompleted, BigDecimal treesPlanted,
                              BigDecimal wasteCollectedKg, long verifiedContributions) {
}
