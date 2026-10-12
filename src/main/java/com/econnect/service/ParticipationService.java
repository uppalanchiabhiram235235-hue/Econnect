package com.econnect.service;

import com.econnect.dto.AttendanceRequest;
import com.econnect.dto.ParticipationResponse;
import com.econnect.entity.*;
import com.econnect.exception.BusinessRuleException;
import com.econnect.exception.ResourceNotFoundException;
import com.econnect.repository.EventRepository;
import com.econnect.repository.ParticipationRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ParticipationService {

    private final ParticipationRepository participations;
    private final EventRepository events;
    private final CurrentUserService currentUser;
    private final GamificationService gamification;

    public ParticipationService(ParticipationRepository participations, EventRepository events,
                                CurrentUserService currentUser, GamificationService gamification) {
        this.participations = participations;
        this.events = events;
        this.currentUser = currentUser;
        this.gamification = gamification;
    }

    /** Capacity + duplicate checks happen here, under a row lock on the event. */
    @Transactional
    public ParticipationResponse join(Long eventId) {
        User user = currentUser.require();
        Event event = events.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
        if (event.getOrganizer().getId().equals(user.getId())) {
            throw new BusinessRuleException("You are the organizer of this event and already have full access");
        }
        if (event.getStatus() != EventStatus.UPCOMING) {
            throw new BusinessRuleException("Registration is closed: event is " + event.getStatus());
        }

        Optional<Participation> existing = participations.findByEventIdAndUserId(eventId, user.getId());
        if (existing.isPresent() && existing.get().getParticipationStatus() != ParticipationStatus.CANCELLED) {
            throw new BusinessRuleException("You have already joined this event");
        }

        long active = participations.countByEventIdAndParticipationStatusNot(eventId, ParticipationStatus.CANCELLED);
        if (active >= event.getMaxVolunteers()) {
            throw new BusinessRuleException("This event is full (" + event.getMaxVolunteers() + " volunteers)");
        }

        Participation p = existing.orElseGet(Participation::new);
        p.setEvent(event);
        p.setUser(user);
        p.setRegistrationDate(LocalDateTime.now());
        p.setParticipationStatus(ParticipationStatus.REGISTERED);
        p.setAttendanceStatus(AttendanceStatus.NOT_MARKED);
        return ParticipationResponse.from(participations.save(p));
    }

    @Transactional
    public void leave(Long eventId) {
        User user = currentUser.require();
        Participation p = participations.findByEventIdAndUserId(eventId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("You have not joined this event"));
        if (p.getParticipationStatus() != ParticipationStatus.REGISTERED) {
            throw new BusinessRuleException("Only an active registration can be cancelled");
        }
        if (p.getEvent().getStatus() != EventStatus.UPCOMING || p.getAttendanceStatus() != AttendanceStatus.NOT_MARKED) {
            throw new BusinessRuleException("You can no longer leave this event");
        }
        p.setParticipationStatus(ParticipationStatus.CANCELLED);
        participations.save(p);
    }

    @Transactional(readOnly = true)
    public List<ParticipationResponse> participants(Long eventId) {
        Event event = events.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
        currentUser.requireOwnerOf(event);
        return participations.findByEventIdOrderByRegistrationDateAsc(eventId).stream()
                .map(ParticipationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ParticipationResponse> myParticipations() {
        User user = currentUser.require();
        return participations.findByUserIdOrderByRegistrationDateDesc(user.getId()).stream()
                .map(ParticipationResponse::from).toList();
    }

    @Transactional
    public ParticipationResponse markAttendance(Long participationId, AttendanceRequest req) {
        Participation p = participations.findById(participationId)
                .orElseThrow(() -> new ResourceNotFoundException("Participation not found: " + participationId));
        Event event = p.getEvent();
        currentUser.requireOwnerOf(event);

        if (req.attendanceStatus() == AttendanceStatus.NOT_MARKED) {
            throw new BusinessRuleException("Attendance must be PRESENT or ABSENT");
        }
        if (p.getParticipationStatus() == ParticipationStatus.CANCELLED) {
            throw new BusinessRuleException("Cancelled registrations cannot be marked");
        }
        if (p.getParticipationStatus() == ParticipationStatus.COMPLETED
                && req.attendanceStatus() == AttendanceStatus.ABSENT) {
            throw new BusinessRuleException("A completed participation cannot be changed to ABSENT");
        }

        p.setAttendanceStatus(req.attendanceStatus());
        if (req.attendanceStatus() == AttendanceStatus.PRESENT) {
            if (!p.isAttendancePointsAwarded()) {
                gamification.addPoints(p.getUser(), GamificationService.ATTEND_POINTS);
                p.setAttendancePointsAwarded(true);
            }
            if (event.getStatus() == EventStatus.COMPLETED
                    && p.getParticipationStatus() == ParticipationStatus.REGISTERED) {
                complete(p);
            }
        }
        return ParticipationResponse.from(participations.save(p));
    }

    /** Called when an event moves to COMPLETED: PRESENT volunteers become COMPLETED. */
    @Transactional
    public void completeEvent(Event event) {
        for (Participation p : participations.findByEventIdOrderByRegistrationDateAsc(event.getId())) {
            if (p.getAttendanceStatus() == AttendanceStatus.PRESENT
                    && p.getParticipationStatus() == ParticipationStatus.REGISTERED) {
                complete(p);
            }
        }
    }

    private void complete(Participation p) {
        p.setParticipationStatus(ParticipationStatus.COMPLETED);
        if (p.getCompletedAt() == null) {
            p.setCompletedAt(LocalDateTime.now());
        }
        if (!p.isCompletionPointsAwarded()) {
            gamification.addPoints(p.getUser(), GamificationService.COMPLETE_POINTS);
            p.setCompletionPointsAwarded(true);
        }
        participations.save(p);
        gamification.evaluateBadges(p.getUser());
    }
}
