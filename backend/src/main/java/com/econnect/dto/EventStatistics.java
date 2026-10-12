package com.econnect.dto;

import java.math.BigDecimal;

public record EventStatistics(Long eventId, int maxVolunteers, long registered, long remainingSlots,
                              long present, long absent, long completed,
                              BigDecimal verifiedImpactTotal, long pendingImpactRecords) {
}
