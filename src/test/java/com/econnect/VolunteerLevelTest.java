package com.econnect;

import com.econnect.entity.VolunteerLevel;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VolunteerLevelTest {

    @Test
    void levelsFollowPointThresholds() {
        assertEquals(VolunteerLevel.BEGINNER, VolunteerLevel.forPoints(0));
        assertEquals(VolunteerLevel.ACTIVE_VOLUNTEER, VolunteerLevel.forPoints(30));
        assertEquals(VolunteerLevel.COMMUNITY_HELPER, VolunteerLevel.forPoints(120));
        assertEquals(VolunteerLevel.COMMUNITY_HERO, VolunteerLevel.forPoints(1000));
    }

    @Test
    void heroIsTheLastLevel() {
        assertTrue(VolunteerLevel.COMMUNITY_HERO.next().isEmpty());
        assertEquals(VolunteerLevel.ACTIVE_VOLUNTEER, VolunteerLevel.BEGINNER.next().orElseThrow());
    }
}
