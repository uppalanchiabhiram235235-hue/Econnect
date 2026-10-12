package com.econnect.entity;

import java.util.Optional;

/** Ordered, rule-based volunteer levels (minimum total points per level). */
public enum VolunteerLevel {
    BEGINNER("Beginner", 0),
    ACTIVE_VOLUNTEER("Active Volunteer", 30),
    COMMUNITY_HELPER("Community Helper", 90),
    GREEN_CHAMPION("Green Champion", 150),
    ECO_WARRIOR("Eco Warrior", 240),
    COMMUNITY_HERO("Community Hero", 360);

    private final String label;
    private final int minPoints;

    VolunteerLevel(String label, int minPoints) {
        this.label = label;
        this.minPoints = minPoints;
    }

    public String getLabel() { return label; }
    public int getMinPoints() { return minPoints; }

    public static VolunteerLevel forPoints(int points) {
        VolunteerLevel result = BEGINNER;
        for (VolunteerLevel level : values()) {
            if (points >= level.minPoints) {
                result = level;
            }
        }
        return result;
    }

    public Optional<VolunteerLevel> next() {
        int i = ordinal() + 1;
        return i < values().length ? Optional.of(values()[i]) : Optional.empty();
    }
}
