package com.econnect.controller;

import com.econnect.dto.BadgeResponse;
import com.econnect.repository.BadgeRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {

    private final BadgeRepository badges;

    public BadgeController(BadgeRepository badges) {
        this.badges = badges;
    }

    @GetMapping
    public List<BadgeResponse> all() {
        return badges.findAll().stream().map(BadgeResponse::from).toList();
    }
}
