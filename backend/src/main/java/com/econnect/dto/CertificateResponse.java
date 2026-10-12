package com.econnect.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record CertificateResponse(
        boolean valid,
        String certificateCode,
        String volunteerName,
        String eventTitle,
        String eventType,
        String eventTypeLabel,
        String location,
        LocalDate eventDate,
        String organizerName,
        double hours,
        List<String> verifiedImpactLines,
        LocalDateTime issuedAt
) {
    public static CertificateResponse invalid() {
        return new CertificateResponse(false, null, null, null, null, null, null, null, null, 0.0, List.of(), null);
    }
}
