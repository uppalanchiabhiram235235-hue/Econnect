package com.econnect;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MapAndDistanceIntegrationTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper om;

    private void register(String email, String role) throws Exception {
        String body = """
                {"name":"Map Test %s","email":"%s","password":"secret123","phone":"9999999999","location":"Hyderabad","role":"%s"}
                """.formatted(role, email, role);
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
    }

    @Test
    void coordinatesValidationBothOrNeitherAndRanges() throws Exception {
        register("map_org_val@test.com", "ORGANIZER");
        var org = httpBasic("map_org_val@test.com", "secret123");

        // Latitude provided, longitude missing -> rejected (409 Conflict)
        String onlyLat = """
                {"title":"Only Lat","description":"d","eventType":"TREE_PLANTING","location":"Hyderabad",
                 "eventDate":"%s","startTime":"09:00","endTime":"12:00","maxVolunteers":10,"requiredVolunteers":5,
                 "latitude":17.385044}""".formatted(LocalDate.now().plusDays(3));
        mvc.perform(post("/api/events").with(org).contentType(MediaType.APPLICATION_JSON).content(onlyLat))
                .andExpect(status().isConflict());

        // Latitude out of range (>90) -> rejected (400 Bad Request)
        String latOutOfRange = """
                {"title":"Bad Lat","description":"d","eventType":"TREE_PLANTING","location":"Hyderabad",
                 "eventDate":"%s","startTime":"09:00","endTime":"12:00","maxVolunteers":10,"requiredVolunteers":5,
                 "latitude":95.0,"longitude":78.0}""".formatted(LocalDate.now().plusDays(3));
        mvc.perform(post("/api/events").with(org).contentType(MediaType.APPLICATION_JSON).content(latOutOfRange))
                .andExpect(status().isBadRequest());

        // Event without coordinates -> 201 Created (backwards compatible)
        String noCoords = """
                {"title":"No Coords","description":"d","eventType":"TREE_PLANTING","location":"Hyderabad",
                 "eventDate":"%s","startTime":"09:00","endTime":"12:00","maxVolunteers":10,"requiredVolunteers":5}"""
                .formatted(LocalDate.now().plusDays(3));
        mvc.perform(post("/api/events").with(org).contentType(MediaType.APPLICATION_JSON).content(noCoords))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.latitude").doesNotExist());
    }

    @Test
    void distanceFilterReturnsNearEventAndExcludesFarEvent() throws Exception {
        register("map_org_dist@test.com", "ORGANIZER");
        var org = httpBasic("map_org_dist@test.com", "secret123");

        // Hyderabad coordinates: 17.385044, 78.486671
        String nearEvent = """
                {"title":"Near Hyderabad Cleanup","description":"clean","eventType":"COMMUNITY_CLEANUP","location":"Hyderabad",
                 "eventDate":"%s","startTime":"08:00","endTime":"11:00","maxVolunteers":20,"requiredVolunteers":10,
                 "latitude":17.385044,"longitude":78.486671}""".formatted(LocalDate.now().plusDays(4));
        mvc.perform(post("/api/events").with(org).contentType(MediaType.APPLICATION_JSON).content(nearEvent))
                .andExpect(status().isCreated());

        // Delhi coordinates: 28.613939, 77.209021 (approx 1250 km away)
        String farEvent = """
                {"title":"Far Delhi Cleanup","description":"clean","eventType":"COMMUNITY_CLEANUP","location":"Delhi",
                 "eventDate":"%s","startTime":"08:00","endTime":"11:00","maxVolunteers":20,"requiredVolunteers":10,
                 "latitude":28.613939,"longitude":77.209021}""".formatted(LocalDate.now().plusDays(4));
        mvc.perform(post("/api/events").with(org).contentType(MediaType.APPLICATION_JSON).content(farEvent))
                .andExpect(status().isCreated());

        // Query near Hyderabad with 50 km radius: should include Near event and exclude Far event
        mvc.perform(get("/api/events")
                        .param("lat", "17.385044")
                        .param("lng", "78.486671")
                        .param("radiusKm", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItem("Near Hyderabad Cleanup")))
                .andExpect(jsonPath("$[*].title", not(hasItem("Far Delhi Cleanup"))))
                .andExpect(jsonPath("$[0].distanceKm", notNullValue()));
    }

    @Test
    void mapEndpointReturnsLightPayloadForUpcomingEventsWithCoordinates() throws Exception {
        register("map_org_pins@test.com", "ORGANIZER");
        var org = httpBasic("map_org_pins@test.com", "secret123");

        String eventWithCoords = """
                {"title":"Map Pin Event","description":"clean","eventType":"BEACH_CLEANUP","location":"Vizag Beach",
                 "eventDate":"%s","startTime":"06:00","endTime":"09:00","maxVolunteers":15,"requiredVolunteers":8,
                 "latitude":17.686816,"longitude":83.218482}""".formatted(LocalDate.now().plusDays(2));
        mvc.perform(post("/api/events").with(org).contentType(MediaType.APPLICATION_JSON).content(eventWithCoords))
                .andExpect(status().isCreated());

        // Public GET /api/events/map
        mvc.perform(get("/api/events/map"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", hasItem("Map Pin Event")))
                .andExpect(jsonPath("$[0].latitude", notNullValue()))
                .andExpect(jsonPath("$[0].longitude", notNullValue()))
                .andExpect(jsonPath("$[0].remainingSlots", notNullValue()));
    }
}
