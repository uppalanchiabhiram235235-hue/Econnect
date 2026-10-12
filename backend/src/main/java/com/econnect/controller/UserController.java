package com.econnect.controller;

import com.econnect.dto.*;
import com.econnect.service.ParticipationService;
import com.econnect.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService users;
    private final ParticipationService participations;

    public UserController(UserService users, ParticipationService participations) {
        this.users = users;
        this.participations = participations;
    }

    @GetMapping("/{id}")
    public UserResponse get(@PathVariable Long id) {
        return users.get(id);
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        return users.update(id, request);
    }

    @GetMapping("/{id}/statistics")
    public UserStatistics statistics(@PathVariable Long id) {
        return users.statistics(id);
    }

    @GetMapping("/{id}/badges")
    public List<BadgeResponse> badges(@PathVariable Long id) {
        return users.badges(id);
    }

    /** Joined events of the current volunteer. */
    @GetMapping("/me/participations")
    public List<ParticipationResponse> myParticipations() {
        return participations.myParticipations();
    }
}
