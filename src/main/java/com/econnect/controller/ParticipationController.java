package com.econnect.controller;

import com.econnect.dto.AttendanceRequest;
import com.econnect.dto.ParticipationResponse;
import com.econnect.service.ParticipationService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/participation")
public class ParticipationController {

    private final ParticipationService participations;

    public ParticipationController(ParticipationService participations) {
        this.participations = participations;
    }

    @PutMapping("/{id}/attendance")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ParticipationResponse attendance(@PathVariable Long id, @Valid @RequestBody AttendanceRequest request) {
        return participations.markAttendance(id, request);
    }
}
