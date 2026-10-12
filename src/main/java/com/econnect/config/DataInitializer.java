package com.econnect.config;

import com.econnect.entity.Badge;
import com.econnect.repository.BadgeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/** Seeds the reusable badge definitions on first start. */
@Component
public class DataInitializer implements CommandLineRunner {

    private final BadgeRepository badges;

    public DataInitializer(BadgeRepository badges) {
        this.badges = badges;
    }

    @Override
    public void run(String... args) {
        List<Badge> defaults = List.of(
                new Badge(BadgeNames.FIRST_STEP, "Completed your first event", "1 completed event"),
                new Badge(BadgeNames.COMMUNITY_HELPER, "A regular helper in the community", "3 completed events"),
                new Badge(BadgeNames.GREEN_CHAMPION, "Committed to the environment", "2 completed environmental events"),
                new Badge(BadgeNames.ECO_WARRIOR, "Made a measurable environmental difference",
                        "50 verified units of waste collected / trees planted across your completed events"),
                new Badge(BadgeNames.CAUSE_LEADER, "A dependable cause leader", "5 completed events"),
                new Badge(BadgeNames.COMMUNITY_HERO, "A true community hero", "10 completed events and 300 points"));
        for (Badge b : defaults) {
            if (badges.findByBadgeName(b.getBadgeName()).isEmpty()) {
                badges.save(b);
            }
        }
    }
}
