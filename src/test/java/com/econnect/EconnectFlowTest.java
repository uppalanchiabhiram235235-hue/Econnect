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

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EconnectFlowTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper om;

    private void register(String email, String role) throws Exception {
        String body = """
                {"name":"Test %s","email":"%s","password":"secret123","phone":"9999999999","location":"Hyderabad","role":"%s"}
                """.formatted(role, email, role);
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
    }

    @Test
    void capacityDuplicateAndPointsFlow() throws Exception {
        register("org@test.com", "ORGANIZER");
        register("vol@test.com", "VOLUNTEER");
        register("vol2@test.com", "VOLUNTEER");
        var org = httpBasic("org@test.com", "secret123");
        var vol = httpBasic("vol@test.com", "secret123");
        var vol2 = httpBasic("vol2@test.com", "secret123");

        // duplicate email is rejected
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"name":"Dup","email":"vol@test.com","password":"secret123","role":"VOLUNTEER"}"""))
                .andExpect(status().isConflict());

        String event = """
                {"title":"Lake Cleanup","description":"d","eventType":"COMMUNITY_CLEANUP","location":"Hussain Sagar",
                 "eventDate":"%s","startTime":"08:00","endTime":"11:00","maxVolunteers":1,"requiredVolunteers":1,
                 "objectives":"Clean the lake shore"}""".formatted(LocalDate.now().plusDays(7));

        // volunteers cannot create events
        mvc.perform(post("/api/events").with(vol).contentType(MediaType.APPLICATION_JSON).content(event))
                .andExpect(status().isForbidden());

        String res = mvc.perform(post("/api/events").with(org).contentType(MediaType.APPLICATION_JSON).content(event))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long eventId = om.readTree(res).get("id").asLong();

        mvc.perform(post("/api/events/" + eventId + "/join").with(vol)).andExpect(status().isCreated());
        // duplicate join
        mvc.perform(post("/api/events/" + eventId + "/join").with(vol)).andExpect(status().isConflict());
        // event is full for the second volunteer
        mvc.perform(post("/api/events/" + eventId + "/join").with(vol2)).andExpect(status().isConflict());

        mvc.perform(get("/api/events/" + eventId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingSlots").value(0))
                .andExpect(jsonPath("$.currentParticipants").value(1));

        // attendance -> +10 points
        String participants = mvc.perform(get("/api/events/" + eventId + "/participants").with(org))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long participationId = om.readTree(participants).get(0).get("id").asLong();
        mvc.perform(put("/api/participation/" + participationId + "/attendance").with(org)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"attendanceStatus\":\"PRESENT\"}"))
                .andExpect(status().isOk());

        // completing the event -> +20 points (30 total) and First Step badge
        String update = event.replace("\"objectives\"", "\"status\":\"COMPLETED\",\"objectives\"");
        mvc.perform(put("/api/events/" + eventId).with(org).contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isOk());

        String me = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"vol@test.com\",\"password\":\"secret123\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long volId = om.readTree(me).get("id").asLong();

        mvc.perform(get("/api/users/" + volId + "/statistics").with(vol))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.points").value(30))
                .andExpect(jsonPath("$.eventsCompleted").value(1))
                .andExpect(jsonPath("$.level").value("Active Volunteer"))
                .andExpect(jsonPath("$.badges[0].name").value("First Step"));
    }
}
