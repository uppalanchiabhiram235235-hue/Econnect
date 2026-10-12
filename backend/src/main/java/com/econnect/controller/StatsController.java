package com.econnect.controller;

import com.econnect.dto.CommunityImpact;
import com.econnect.dto.OrganizerStatistics;
import com.econnect.service.StatsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class StatsController {

    private final StatsService stats;

    public StatsController(StatsService stats) {
        this.stats = stats;
    }

    @GetMapping("/stats/community")
    public CommunityImpact community() {
        return stats.community();
    }

    @GetMapping("/organizers/{id}/statistics")
    @PreAuthorize("hasRole('ORGANIZER')")
    public OrganizerStatistics organizer(@PathVariable Long id) {
        return stats.organizer(id);
    }
}
