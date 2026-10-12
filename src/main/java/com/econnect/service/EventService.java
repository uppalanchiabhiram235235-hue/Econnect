package com.econnect.service;

import com.econnect.dto.*;
import com.econnect.entity.*;
import com.econnect.exception.BusinessRuleException;
import com.econnect.exception.ResourceNotFoundException;
import com.econnect.repository.EventRepository;
import com.econnect.repository.ImpactRepository;
import com.econnect.repository.ParticipationRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class EventService {

    private final EventRepository events;
    private final ParticipationRepository participations;
    private final ImpactRepository impacts;
    private final CurrentUserService currentUser;
    private final ParticipationService participationService;

    public EventService(EventRepository events, ParticipationRepository participations, ImpactRepository impacts,
                        CurrentUserService currentUser, ParticipationService participationService) {
        this.events = events;
        this.participations = participations;
        this.impacts = impacts;
        this.currentUser = currentUser;
        this.participationService = participationService;
    }

    @Transactional(readOnly = true)
    public List<EventResponse> search(String q, EventType type, String location, LocalDate date, EventStatus status,
                                      Double lat, Double lng, Double radiusKm) {
        Specification<Event> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (StringUtils.hasText(q)) {
                String like = "%" + q.trim().toLowerCase() + "%";
                ps.add(cb.or(cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("location")), like)));
            }
            if (type != null) ps.add(cb.equal(root.get("eventType"), type));
            if (StringUtils.hasText(location)) {
                ps.add(cb.like(cb.lower(root.get("location")), "%" + location.trim().toLowerCase() + "%"));
            }
            if (date != null) ps.add(cb.equal(root.get("eventDate"), date));
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            return cb.and(ps.toArray(new Predicate[0]));
        };

        boolean useDistance = lat != null && lng != null && radiusKm != null;
        if (useDistance) {
            double effectiveRadius = Math.min(Math.max(radiusKm, 0.0), 200.0);
            List<Event> all = events.findAll(spec);
            record EventWithDistance(Event event, double distanceKm) {}
            return all.stream()
                    .filter(e -> e.getLatitude() != null && e.getLongitude() != null)
                    .map(e -> new EventWithDistance(e, haversineKm(lat, lng, e.getLatitude().doubleValue(), e.getLongitude().doubleValue())))
                    .filter(ewd -> ewd.distanceKm() <= effectiveRadius)
                    .sorted((a, b) -> Double.compare(a.distanceKm(), b.distanceKm()))
                    .map(ewd -> toResponse(ewd.event(), false, ewd.distanceKm()))
                    .toList();
        }

        return events.findAll(spec, Sort.by("eventDate", "startTime")).stream()
                .map(e -> toResponse(e, false, null)).toList();
    }

    @Transactional(readOnly = true)
    public List<EventResponse> search(String q, EventType type, String location, LocalDate date, EventStatus status) {
        return search(q, type, location, date, status, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<EventMapPinResponse> mapPins() {
        return events.findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNull(EventStatus.UPCOMING).stream()
                .map(e -> {
                    long active = participations.countByEventIdAndParticipationStatusNot(e.getId(), ParticipationStatus.CANCELLED);
                    return new EventMapPinResponse(
                            e.getId(), e.getTitle(), e.getEventType(), e.getEventType().getLabel(),
                            e.getLatitude(), e.getLongitude(), e.getEventDate(), e.getStatus(),
                            Math.max(0, e.getMaxVolunteers() - active));
                }).toList();
    }


    @Transactional(readOnly = true)
    public List<EventResponse> featured() {
        return events.findByStatusOrderByEventDateAsc(EventStatus.UPCOMING, PageRequest.of(0, 6)).stream()
                .map(e -> toResponse(e, false)).toList();
    }

    @Transactional(readOnly = true)
    public List<EventResponse> mine() {
        User organizer = currentUser.require();
        return events.findByOrganizerIdOrderByEventDateDesc(organizer.getId()).stream()
                .map(e -> toResponse(e, false)).toList();
    }

    @Transactional(readOnly = true)
    public EventResponse get(Long id) {
        return toResponse(find(id), true);
    }

    @Transactional
    public EventResponse create(EventRequest r) {
        User organizer = currentUser.require();
        if (organizer.getRole() != Role.ORGANIZER) {
            throw new org.springframework.security.access.AccessDeniedException("Only organizers can create events");
        }
        Event e = new Event();
        e.setOrganizer(organizer);
        e.setStatus(EventStatus.UPCOMING);
        apply(e, r);
        return toResponse(events.save(e), false);
    }

    @Transactional
    public EventResponse update(Long id, EventRequest r) {
        Event e = find(id);
        currentUser.requireOwnerOf(e);
        if (e.getStatus() == EventStatus.CANCELLED || e.getStatus() == EventStatus.COMPLETED) {
            throw new BusinessRuleException("A " + e.getStatus() + " event can no longer be edited");
        }
        long active = participations.countByEventIdAndParticipationStatusNot(id, ParticipationStatus.CANCELLED);
        if (r.maxVolunteers() < active) {
            throw new BusinessRuleException("Capacity cannot be lower than current registrations (" + active + ")");
        }
        apply(e, r);
        if (r.status() != null && r.status() != e.getStatus()) {
            e.setStatus(r.status());
            events.save(e);
            if (r.status() == EventStatus.COMPLETED) {
                participationService.completeEvent(e);
            }
        } else {
            events.save(e);
        }
        return toResponse(e, false);
    }

    /** Policy: events with registrations or impact records are cancelled; empty events are deleted. */
    @Transactional
    public Map<String, String> delete(Long id) {
        Event e = find(id);
        currentUser.requireOwnerOf(e);
        if (participations.existsByEventId(id) || impacts.existsByEventId(id)) {
            e.setStatus(EventStatus.CANCELLED);
            events.save(e);
            return Map.of("message", "Event has history, so it was marked CANCELLED instead of deleted");
        }
        events.delete(e);
        return Map.of("message", "Event deleted");
    }

    @Transactional(readOnly = true)
    public EventStatistics statistics(Long id) {
        Event e = find(id);
        currentUser.requireOwnerOf(e);
        List<Participation> all = participations.findByEventIdOrderByRegistrationDateAsc(id).stream()
                .filter(p -> p.getParticipationStatus() != ParticipationStatus.CANCELLED).toList();
        long present = all.stream().filter(p -> p.getAttendanceStatus() == AttendanceStatus.PRESENT).count();
        long absent = all.stream().filter(p -> p.getAttendanceStatus() == AttendanceStatus.ABSENT).count();
        long completed = all.stream().filter(p -> p.getParticipationStatus() == ParticipationStatus.COMPLETED).count();
        return new EventStatistics(id, e.getMaxVolunteers(), all.size(),
                Math.max(0, e.getMaxVolunteers() - all.size()), present, absent, completed,
                impacts.sumForEvent(id, VerificationStatus.VERIFIED),
                impacts.countByEventIdAndVerificationStatus(id, VerificationStatus.PENDING));
    }

    // ---------------------------------------------------------------- helpers

    private Event find(Long id) {
        return events.findById(id).orElseThrow(() -> new ResourceNotFoundException("Event not found: " + id));
    }

    private void apply(Event e, EventRequest r) {
        if (!r.endTime().isAfter(r.startTime())) {
            throw new BusinessRuleException("End time must be after start time");
        }
        int max = r.maxVolunteers();
        int required = r.requiredVolunteers() != null ? r.requiredVolunteers() : max;
        if (required > max) {
            throw new BusinessRuleException("Required volunteers cannot exceed maximum volunteers");
        }
        e.setTitle(r.title().trim());
        e.setDescription(r.description());
        e.setEventType(r.eventType());
        e.setLocation(r.location().trim());
        e.setEventDate(r.eventDate());
        e.setStartTime(r.startTime());
        e.setEndTime(r.endTime());
        e.setMaxVolunteers(max);
        e.setRequiredVolunteers(required);
        e.setObjectives(r.objectives());

        if ((r.latitude() == null && r.longitude() != null) || (r.latitude() != null && r.longitude() == null)) {
            throw new BusinessRuleException("Both latitude and longitude must be provided, or neither");
        }
        if (r.latitude() != null) {
            double lat = r.latitude().doubleValue();
            if (lat < -90.0 || lat > 90.0) {
                throw new BusinessRuleException("Latitude must be between -90 and 90");
            }
        }
        if (r.longitude() != null) {
            double lon = r.longitude().doubleValue();
            if (lon < -180.0 || lon > 180.0) {
                throw new BusinessRuleException("Longitude must be between -180 and 180");
            }
        }
        e.setLatitude(r.latitude());
        e.setLongitude(r.longitude());
    }

    public static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 100.0) / 100.0;
    }

    private EventResponse toResponse(Event e, boolean withImpact) {
        return toResponse(e, withImpact, null);
    }

    private EventResponse toResponse(Event e, boolean withImpact, Double distanceKm) {
        long active = participations.countByEventIdAndParticipationStatusNot(e.getId(), ParticipationStatus.CANCELLED);
        String mine = currentUser.find()
                .flatMap(u -> participations.findByEventIdAndUserId(e.getId(), u.getId()))
                .map(p -> p.getParticipationStatus().name())
                .orElse(null);
        List<ImpactResponse> verified = withImpact
                ? impacts.findByEventIdAndVerificationStatusOrderByRecordedAtDesc(e.getId(), VerificationStatus.VERIFIED)
                        .stream().map(ImpactResponse::from).toList()
                : null;
        return new EventResponse(e.getId(), e.getTitle(), e.getDescription(), e.getEventType(),
                e.getEventType().getLabel(), e.getLocation(), e.getEventDate(), e.getStartTime(), e.getEndTime(),
                e.getMaxVolunteers(), e.getRequiredVolunteers(), e.getObjectives(), e.getStatus(),
                e.getOrganizer().getId(), e.getOrganizer().getName(),
                active, Math.max(0, e.getMaxVolunteers() - active), mine, verified,
                e.getLatitude(), e.getLongitude(), distanceKm);
    }
}
