package com.econnect.dto;

public record OrganizerStatistics(long totalEvents, long upcomingEvents, long completedEvents,
                                  long totalParticipants, long presentCount, long absentCount,
                                  long verifiedImpactRecords) {
}
