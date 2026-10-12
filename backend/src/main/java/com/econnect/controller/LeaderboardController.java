package com.econnect.controller;

import com.econnect.dto.LeaderboardEntryResponse;
import com.econnect.dto.LeaderboardScope;
import com.econnect.dto.UserRankResponse;
import com.econnect.service.LeaderboardService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class LeaderboardController {

    private final LeaderboardService leaderboard;

    public LeaderboardController(LeaderboardService leaderboard) {
        this.leaderboard = leaderboard;
    }

    @GetMapping("/leaderboard")
    public List<LeaderboardEntryResponse> getLeaderboard(
            @RequestParam(defaultValue = "ALL_TIME") LeaderboardScope scope,
            @RequestParam(defaultValue = "10") Integer limit) {
        return leaderboard.getLeaderboard(scope, limit);
    }

    @GetMapping("/users/me/rank")
    public UserRankResponse getMyRank() {
        return leaderboard.getCurrentUserRank();
    }
}
