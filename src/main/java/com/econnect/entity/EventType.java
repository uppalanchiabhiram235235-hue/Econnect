package com.econnect.entity;

import java.util.Arrays;
import java.util.List;

public enum EventType {
    COMMUNITY_CLEANUP("Community Cleanup", true),
    BEACH_CLEANUP("Beach Cleanup", true),
    TREE_PLANTING("Tree Planting", true),
    WASTE_COLLECTION("Waste Collection", true),
    ENVIRONMENTAL_CAMPAIGN("Environmental Campaign", true),
    SOCIAL_CAUSE("Social Cause", false),
    OTHER("Other", false);

    private final String label;
    private final boolean environmental;

    EventType(String label, boolean environmental) {
        this.label = label;
        this.environmental = environmental;
    }

    public String getLabel() { return label; }
    public boolean isEnvironmental() { return environmental; }

    public static List<EventType> environmentalTypes() {
        return Arrays.stream(values()).filter(EventType::isEnvironmental).toList();
    }
}
