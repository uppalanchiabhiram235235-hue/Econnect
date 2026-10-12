package com.econnect.service;

import com.econnect.dto.ImpactRequest;
import com.econnect.dto.ImpactResponse;
import com.econnect.dto.ImpactVerifyRequest;
import com.econnect.entity.*;
import com.econnect.exception.BusinessRuleException;
import com.econnect.exception.ResourceNotFoundException;
import com.econnect.repository.EventRepository;
import com.econnect.repository.ImpactRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ImpactService {

    private final ImpactRepository impacts;
    private final EventRepository events;
    private final CurrentUserService currentUser;
    private final GamificationService gamification;

    public ImpactService(ImpactRepository impacts, EventRepository events,
                         CurrentUserService currentUser, GamificationService gamification) {
        this.impacts = impacts;
        this.events = events;
        this.currentUser = currentUser;
        this.gamification = gamification;
    }

    @Transactional
    public ImpactResponse record(Long eventId, ImpactRequest r) {
        Event event = findEvent(eventId);
        User recorder = currentUser.requireOwnerOf(event);
        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new BusinessRuleException("Impact cannot be recorded for a cancelled event");
        }
        ImpactRecord rec = new ImpactRecord();
        rec.setEvent(event);
        rec.setImpactType(r.impactType());
        rec.setQuantity(r.quantity());
        rec.setUnit(r.unit().trim());
        rec.setDescription(r.description());
        rec.setRecordedBy(recorder);
        rec.setVerificationStatus(VerificationStatus.PENDING);
        return ImpactResponse.from(impacts.save(rec));
    }

    /** Owner sees every record; everyone else only sees VERIFIED (official) records. */
    @Transactional(readOnly = true)
    public List<ImpactResponse> list(Long eventId) {
        Event event = findEvent(eventId);
        boolean owner = currentUser.find()
                .map(u -> u.getId().equals(event.getOrganizer().getId())).orElse(false);
        List<ImpactRecord> records = owner
                ? impacts.findByEventIdOrderByRecordedAtDesc(eventId)
                : impacts.findByEventIdAndVerificationStatusOrderByRecordedAtDesc(eventId, VerificationStatus.VERIFIED);
        return records.stream().map(ImpactResponse::from).toList();
    }

    @Transactional
    public ImpactResponse verify(Long impactId, ImpactVerifyRequest r) {
        ImpactRecord rec = impacts.findById(impactId)
                .orElseThrow(() -> new ResourceNotFoundException("Impact record not found: " + impactId));
        currentUser.requireOwnerOf(rec.getEvent());
        if (rec.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new BusinessRuleException("Only PENDING impact records can be verified or rejected");
        }
        if (r.status() == VerificationStatus.PENDING) {
            throw new BusinessRuleException("Status must be VERIFIED or REJECTED");
        }
        rec.setVerificationStatus(r.status());
        impacts.save(rec);
        if (r.status() == VerificationStatus.VERIFIED) {
            gamification.onImpactVerified(rec.getEvent());
        }
        return ImpactResponse.from(rec);
    }

    private Event findEvent(Long id) {
        return events.findById(id).orElseThrow(() -> new ResourceNotFoundException("Event not found: " + id));
    }
}
