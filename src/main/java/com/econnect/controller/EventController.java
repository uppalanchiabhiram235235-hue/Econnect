package com.econnect.controller;

import com.econnect.dto.EventRequest;
import com.econnect.dto.EventResponse;
import com.econnect.dto.EventStatistics;
import com.econnect.dto.ParticipationResponse;
import com.econnect.entity.EventStatus;
import com.econnect.entity.EventType;
import com.econnect.service.EventService;
import com.econnect.service.ParticipationService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService events;
    private final ParticipationService participations;

    public EventController(EventService events, ParticipationService participations) {
        this.events = events;
        this.participations = participations;
    }

    @GetMapping
    public List<EventResponse> list(@RequestParam(required = false) String q,
                                    @RequestParam(required = false) EventType type,
                                    @RequestParam(required = false) String location,
                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                    @RequestParam(required = false) EventStatus status,
                                    @RequestParam(required = false) Double lat,
                                    @RequestParam(required = false) Double lng,
                                    @RequestParam(required = false) Double radiusKm) {
        return events.search(q, type, location, date, status, lat, lng, radiusKm);
    }

    @GetMapping("/map")
    public List<com.econnect.dto.EventMapPinResponse> map() {
        return events.mapPins();
    }

    @GetMapping("/featured")
    public List<EventResponse> featured() {
        return events.featured();
    }


    @GetMapping("/mine")
    @PreAuthorize("hasRole('ORGANIZER')")
    public List<EventResponse> mine() {
        return events.mine();
    }

    @GetMapping("/{id}")
    public EventResponse get(@PathVariable Long id) {
        return events.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ORGANIZER')")
    public EventResponse create(@Valid @RequestBody EventRequest request) {
        return events.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER')")
    public EventResponse update(@PathVariable Long id, @Valid @RequestBody EventRequest request) {
        return events.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER')")
    public Map<String, String> delete(@PathVariable Long id) {
        return events.delete(id);
    }

    @GetMapping("/{id}/statistics")
    @PreAuthorize("hasRole('ORGANIZER')")
    public EventStatistics statistics(@PathVariable Long id) {
        return events.statistics(id);
    }

    @PostMapping("/{eventId}/join")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ParticipationResponse join(@PathVariable Long eventId) {
        return participations.join(eventId);
    }

    @DeleteMapping("/{eventId}/leave")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> leave(@PathVariable Long eventId) {
        participations.leave(eventId);
        return Map.of("message", "You have left the event");
    }

    @GetMapping("/{eventId}/participants")
    @PreAuthorize("hasRole('ORGANIZER')")
    public List<ParticipationResponse> participants(@PathVariable Long eventId) {
        return participations.participants(eventId);
    }
}
