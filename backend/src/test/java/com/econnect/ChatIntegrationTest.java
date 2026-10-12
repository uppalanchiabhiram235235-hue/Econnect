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
class ChatIntegrationTest {

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

    private long createEvent(String orgEmail) throws Exception {
        var org = httpBasic(orgEmail, "secret123");
        String event = """
                {"title":"Beach Cleanup Chat","description":"cleanup","eventType":"BEACH_CLEANUP","location":"Vizag",
                 "eventDate":"%s","startTime":"08:00","endTime":"11:00","maxVolunteers":10,"requiredVolunteers":5,
                 "objectives":"Clean beach shore"}""".formatted(LocalDate.now().plusDays(5));
        String res = mvc.perform(post("/api/events").with(org).contentType(MediaType.APPLICATION_JSON).content(event))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return om.readTree(res).get("id").asLong();
    }

    @Test
    void nonParticipantCannotReadOrPostChat() throws Exception {
        register("chat_org1@test.com", "ORGANIZER");
        register("chat_vol1@test.com", "VOLUNTEER");
        register("chat_outsider@test.com", "VOLUNTEER");

        var outsider = httpBasic("chat_outsider@test.com", "secret123");
        long eventId = createEvent("chat_org1@test.com");

        // Outsider has not joined -> GET returns 403 Forbidden
        mvc.perform(get("/api/events/" + eventId + "/chat").with(outsider))
                .andExpect(status().isForbidden());

        // Outsider has not joined -> POST returns 403 Forbidden
        mvc.perform(post("/api/events/" + eventId + "/chat").with(outsider)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Hello outsider\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void participantCanPostAndPollingWithAfterIdOnlyReturnsNewerMessages() throws Exception {
        register("chat_org2@test.com", "ORGANIZER");
        register("chat_vol2@test.com", "VOLUNTEER");

        var org = httpBasic("chat_org2@test.com", "secret123");
        var vol = httpBasic("chat_vol2@test.com", "secret123");
        long eventId = createEvent("chat_org2@test.com");

        // Vol joins event
        mvc.perform(post("/api/events/" + eventId + "/join").with(vol)).andExpect(status().isCreated());

        // Vol posts message 1
        String postRes1 = mvc.perform(post("/api/events/" + eventId + "/chat").with(vol)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"First message from volunteer\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mine").value(true))
                .andExpect(jsonPath("$.content").value("First message from volunteer"))
                .andReturn().getResponse().getContentAsString();
        long msg1Id = om.readTree(postRes1).get("id").asLong();

        // Org reads chat without afterId -> sees message 1
        mvc.perform(get("/api/events/" + eventId + "/chat").with(org))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages", hasSize(1)))
                .andExpect(jsonPath("$.messages[0].id").value(msg1Id))
                .andExpect(jsonPath("$.messages[0].mine").value(false));

        // Vol posts message 2
        String postRes2 = mvc.perform(post("/api/events/" + eventId + "/chat").with(vol)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Second message\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long msg2Id = om.readTree(postRes2).get("id").asLong();

        // Org polls with afterId=msg1Id -> only message 2 is returned
        mvc.perform(get("/api/events/" + eventId + "/chat").with(org)
                        .param("afterId", String.valueOf(msg1Id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages", hasSize(1)))
                .andExpect(jsonPath("$.messages[0].id").value(msg2Id))
                .andExpect(jsonPath("$.messages[0].content").value("Second message"));
    }

    @Test
    void onlyOrganizerCanPinAndTogglePin() throws Exception {
        register("chat_org3@test.com", "ORGANIZER");
        register("chat_vol3@test.com", "VOLUNTEER");

        var org = httpBasic("chat_org3@test.com", "secret123");
        var vol = httpBasic("chat_vol3@test.com", "secret123");
        long eventId = createEvent("chat_org3@test.com");

        mvc.perform(post("/api/events/" + eventId + "/join").with(vol)).andExpect(status().isCreated());

        // Volunteer attempts to post with pinned=true -> 403 Forbidden
        mvc.perform(post("/api/events/" + eventId + "/chat").with(vol)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Volunteer trying to pin\",\"pinned\":true}"))
                .andExpect(status().isForbidden());

        // Organizer posts pinned announcement -> 201 Created
        String orgMsgRes = mvc.perform(post("/api/events/" + eventId + "/chat").with(org)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Important announcement!\",\"pinned\":true}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pinned").value(true))
                .andReturn().getResponse().getContentAsString();
        long pinnedMsgId = om.readTree(orgMsgRes).get("id").asLong();

        // Initial load includes pinned announcements in pinned list
        mvc.perform(get("/api/events/" + eventId + "/chat").with(vol))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pinned", hasSize(1)))
                .andExpect(jsonPath("$.pinned[0].id").value(pinnedMsgId));

        // Volunteer attempts to toggle pin -> 403 Forbidden
        mvc.perform(put("/api/chat/" + pinnedMsgId + "/pin").with(vol))
                .andExpect(status().isForbidden());

        // Organizer unpins message -> 200 OK, pinned is now false
        mvc.perform(put("/api/chat/" + pinnedMsgId + "/pin").with(org))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pinned").value(false));
    }

    @Test
    void rateLimitTriggersAfter10MessagesPerMinute() throws Exception {
        register("chat_org4@test.com", "ORGANIZER");
        register("chat_vol4@test.com", "VOLUNTEER");

        var vol = httpBasic("chat_vol4@test.com", "secret123");
        long eventId = createEvent("chat_org4@test.com");

        mvc.perform(post("/api/events/" + eventId + "/join").with(vol)).andExpect(status().isCreated());

        // Send 10 messages successfully
        for (int i = 1; i <= 10; i++) {
            mvc.perform(post("/api/events/" + eventId + "/chat").with(vol)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"content\":\"Message " + i + "\"}"))
                    .andExpect(status().isCreated());
        }

        // 11th message triggers 409 Conflict (BusinessRuleException)
        mvc.perform(post("/api/events/" + eventId + "/chat").with(vol)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Spam message 11\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Maximum 10 messages per minute")));
    }

    @Test
    void softDeleteMessage() throws Exception {
        register("chat_org5@test.com", "ORGANIZER");
        register("chat_vol5@test.com", "VOLUNTEER");

        var org = httpBasic("chat_org5@test.com", "secret123");
        var vol = httpBasic("chat_vol5@test.com", "secret123");
        long eventId = createEvent("chat_org5@test.com");

        mvc.perform(post("/api/events/" + eventId + "/join").with(vol)).andExpect(status().isCreated());

        String msgRes = mvc.perform(post("/api/events/" + eventId + "/chat").with(vol)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Message to delete\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long msgId = om.readTree(msgRes).get("id").asLong();

        // Volunteer can delete own message
        mvc.perform(delete("/api/chat/" + msgId).with(vol))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(true))
                .andExpect(jsonPath("$.content").value("Message removed"));
    }
}
