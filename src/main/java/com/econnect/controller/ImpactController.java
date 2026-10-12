package com.econnect.controller;

import com.econnect.dto.ImpactRequest;
import com.econnect.dto.ImpactResponse;
import com.econnect.dto.ImpactVerifyRequest;
import com.econnect.service.ImpactService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ImpactController {

    private final ImpactService impacts;

    public ImpactController(ImpactService impacts) {
        this.impacts = impacts;
    }

    @PostMapping("/events/{eventId}/impact")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ORGANIZER')")
    public ImpactResponse record(@PathVariable Long eventId, @Valid @RequestBody ImpactRequest request) {
        return impacts.record(eventId, request);
    }

    @GetMapping("/events/{eventId}/impact")
    public List<ImpactResponse> list(@PathVariable Long eventId) {
        return impacts.list(eventId);
    }

    @PutMapping("/impact/{id}/verify")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ImpactResponse verify(@PathVariable Long id, @Valid @RequestBody ImpactVerifyRequest request) {
        return impacts.verify(id, request);
    }
}
