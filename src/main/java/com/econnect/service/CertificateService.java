package com.econnect.service;

import com.econnect.dto.CertificateResponse;
import com.econnect.entity.*;
import com.econnect.exception.BusinessRuleException;
import com.econnect.exception.ResourceNotFoundException;
import com.econnect.repository.ImpactRepository;
import com.econnect.repository.ParticipationRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CertificateService {

    private final ParticipationRepository participations;
    private final ImpactRepository impacts;
    private final CurrentUserService currentUser;

    public CertificateService(ParticipationRepository participations,
                              ImpactRepository impacts,
                              CurrentUserService currentUser) {
        this.participations = participations;
        this.impacts = impacts;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public CertificateResponse getCertificateForParticipation(Long participationId) {
        User user = currentUser.require();
        Participation p = participations.findById(participationId)
                .orElseThrow(() -> new ResourceNotFoundException("Participation record not found: " + participationId));

        if (!p.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only view your own certificates");
        }

        if (p.getParticipationStatus() != ParticipationStatus.COMPLETED) {
            throw new BusinessRuleException("Certificate is only available for completed participations");
        }

        return buildCertificateResponse(p, true);
    }

    @Transactional(readOnly = true)
    public CertificateResponse verifyCertificate(String code) {
        Optional<Long> idOpt = parseParticipationId(code);
        if (idOpt.isEmpty()) {
            return CertificateResponse.invalid();
        }

        Optional<Participation> pOpt = participations.findById(idOpt.get());
        if (pOpt.isEmpty()) {
            return CertificateResponse.invalid();
        }

        Participation p = pOpt.get();
        if (p.getParticipationStatus() != ParticipationStatus.COMPLETED) {
            return CertificateResponse.invalid();
        }

        String expectedCode = generateCode(p);
        if (!expectedCode.equalsIgnoreCase(code.trim())) {
            return CertificateResponse.invalid();
        }

        return buildCertificateResponse(p, true);
    }

    public String generateCode(Participation p) {
        int year = p.getEvent().getEventDate().getYear();
        long id = p.getId();
        String checksum = computeChecksum(id, p.getUser().getId(), p.getEvent().getId());
        return String.format("ECN-%d-%06d-%s", year, id, checksum);
    }

    private Optional<Long> parseParticipationId(String code) {
        if (code == null) return Optional.empty();
        String[] parts = code.trim().toUpperCase().split("-");
        if (parts.length != 4 || !parts[0].equals("ECN")) {
            return Optional.empty();
        }
        try {
            long id = Long.parseLong(parts[2]);
            return Optional.of(id);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private String computeChecksum(long participationId, long userId, long eventId) {
        try {
            String raw = participationId + ":" + userId + ":" + eventId + ":econnect_salt";
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 2; i++) {
                sb.append(String.format("%02X", hash[i]));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return String.format("%04X", (int) (participationId * 31 + userId * 17 + eventId) & 0xFFFF);
        }
    }

    private CertificateResponse buildCertificateResponse(Participation p, boolean valid) {
        Event event = p.getEvent();
        User volunteer = p.getUser();

        double hours = 0.0;
        if (event.getStartTime() != null && event.getEndTime() != null) {
            long minutes = Duration.between(event.getStartTime(), event.getEndTime()).toMinutes();
            if (minutes > 0) {
                hours = Math.round((minutes / 60.0) * 10.0) / 10.0;
            }
        }

        List<String> impactLines = impacts.findByEventIdAndVerificationStatusOrderByRecordedAtDesc(
                event.getId(), VerificationStatus.VERIFIED
        ).stream().map(i -> i.getQuantity() + " " + i.getUnit() + " of " + i.getImpactType().name()).toList();

        LocalDateTime issuedAt = p.getCompletedAt() != null ? p.getCompletedAt() : p.getRegistrationDate();

        return new CertificateResponse(
                valid,
                generateCode(p),
                volunteer.getName(),
                event.getTitle(),
                event.getEventType().name(),
                event.getEventType().getLabel(),
                event.getLocation(),
                event.getEventDate(),
                event.getOrganizer().getName(),
                hours,
                impactLines,
                issuedAt
        );
    }
}
