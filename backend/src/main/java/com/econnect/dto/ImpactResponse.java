package com.econnect.dto;

import com.econnect.entity.ImpactRecord;
import com.econnect.entity.ImpactType;
import com.econnect.entity.VerificationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ImpactResponse(Long id, Long eventId, ImpactType impactType, BigDecimal quantity, String unit,
                             String description, VerificationStatus verificationStatus,
                             String recordedBy, LocalDateTime recordedAt) {

    public static ImpactResponse from(ImpactRecord i) {
        return new ImpactResponse(i.getId(), i.getEvent().getId(), i.getImpactType(), i.getQuantity(),
                i.getUnit(), i.getDescription(), i.getVerificationStatus(),
                i.getRecordedBy().getName(), i.getRecordedAt());
    }
}
