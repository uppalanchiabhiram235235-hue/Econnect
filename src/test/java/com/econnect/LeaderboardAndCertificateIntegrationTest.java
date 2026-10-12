package com.econnect;

import com.econnect.dto.CertificateResponse;
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
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LeaderboardAndCertificateIntegrationTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper om;

    private void register(String email, String role) throws Exception {
        String body = """
                {"name":"Test %s","email":"%s","password":"secret123","phone":"9999999999","location":"Hyderabad","role":"%s"}
                """.formatted(email.split("@")[0], email, role);
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
    }

    @Test
    void leaderboardRanksByCompletedAndVerifiedImpactIgnoringPending() throws Exception {
        String orgEmail = "lead_org@test.com";
        String vol1Email = "lead_vol1@test.com";
        String vol2Email = "lead_vol2@test.com";

        register(orgEmail, "ORGANIZER");
        register(vol1Email, "VOLUNTEER");
        register(vol2Email, "VOLUNTEER");

        var org = httpBasic(orgEmail, "secret123");
        var vol1 = httpBasic(vol1Email, "secret123");
        var vol2 = httpBasic(vol2Email, "secret123");

        // Create Event
        String eventJson = """
                {"title":"Leaderboard Event","description":"desc","eventType":"COMMUNITY_CLEANUP",
                 "location":"Park","eventDate":"%s","startTime":"09:00","endTime":"12:00",
                 "maxVolunteers":20,"requiredVolunteers":5}""".formatted(LocalDate.now().plusDays(2));
        String res = mvc.perform(post("/api/events").with(org).contentType(MediaType.APPLICATION_JSON).content(eventJson))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long eventId = om.readTree(res).get("id").asLong();

        // vol1 and vol2 join
        String part1Res = mvc.perform(post("/api/events/" + eventId + "/join").with(vol1))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long part1Id = om.readTree(part1Res).get("id").asLong();

        mvc.perform(post("/api/events/" + eventId + "/join").with(vol2))
                .andExpect(status().isCreated());

        // Add impact: 1 PENDING and 1 VERIFIED
        String pendingImpact = """
                {"impactType":"WASTE_COLLECTED","quantity":100.0,"unit":"kg","description":"Pending waste"}""";
        mvc.perform(post("/api/events/" + eventId + "/impact").with(org).contentType(MediaType.APPLICATION_JSON).content(pendingImpact))
                .andExpect(status().isCreated());

        String verifiedImpact = """
                {"impactType":"WASTE_COLLECTED","quantity":50.0,"unit":"kg","description":"Verified waste"}""";
        String impRes = mvc.perform(post("/api/events/" + eventId + "/impact").with(org).contentType(MediaType.APPLICATION_JSON).content(verifiedImpact))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long impId = om.readTree(impRes).get("id").asLong();

        // Verify the second impact
        mvc.perform(put("/api/impact/" + impId + "/verify").with(org).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"VERIFIED\"}"))
                .andExpect(status().isOk());

        // Mark attendance for vol1 -> PRESENT (+10 pts)
        mvc.perform(put("/api/participation/" + part1Id + "/attendance").with(org)
                .contentType(MediaType.APPLICATION_JSON).content("{\"attendanceStatus\":\"PRESENT\"}"))
                .andExpect(status().isOk());

        // Complete event -> vol1 becomes COMPLETED (+20 pts -> total 30 pts)
        mvc.perform(put("/api/events/" + eventId).with(org).contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"title":"Leaderboard Event","description":"desc","eventType":"COMMUNITY_CLEANUP",
                         "location":"Park","eventDate":"%s","startTime":"09:00","endTime":"12:00",
                         "maxVolunteers":20,"requiredVolunteers":5,"status":"COMPLETED"}""".formatted(LocalDate.now().plusDays(2))))
                .andExpect(status().isOk());

        // Query public leaderboard
        mvc.perform(get("/api/leaderboard?scope=ALL_TIME&limit=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$[?(@.name == 'Test lead_vol1')].points", hasItem(30)))
                .andExpect(jsonPath("$[?(@.name == 'Test lead_vol1')].verifiedImpactTotal", hasItem(50.0))); // ignores 100.0 pending impact!

        // Query caller's rank
        mvc.perform(get("/api/users/me/rank").with(vol1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rank", notNullValue()))
                .andExpect(jsonPath("$.points", greaterThanOrEqualTo(30)));
    }

    @Test
    void certificateRefusedForNonCompletedAndVerifiedCorrectly() throws Exception {
        String orgEmail = "cert_org@test.com";
        String volEmail = "cert_vol@test.com";

        register(orgEmail, "ORGANIZER");
        register(volEmail, "VOLUNTEER");

        var org = httpBasic(orgEmail, "secret123");
        var vol = httpBasic(volEmail, "secret123");

        // Create Event
        String eventJson = """
                {"title":"Clean Rivers Initiative","description":"River cleaning","eventType":"COMMUNITY_CLEANUP",
                 "location":"Riverbank","eventDate":"%s","startTime":"08:00","endTime":"11:00",
                 "maxVolunteers":15,"requiredVolunteers":5}""".formatted(LocalDate.now().plusDays(1));
        String res = mvc.perform(post("/api/events").with(org).contentType(MediaType.APPLICATION_JSON).content(eventJson))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long eventId = om.readTree(res).get("id").asLong();

        // Join
        String partRes = mvc.perform(post("/api/events/" + eventId + "/join").with(vol))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long partId = om.readTree(partRes).get("id").asLong();

        // 1. Certificate refused when participation is REGISTERED (not COMPLETED) -> 409 Conflict
        mvc.perform(get("/api/participation/" + partId + "/certificate").with(vol))
                .andExpect(status().isConflict());

        // 2. Fake certificate verification -> valid=false
        mvc.perform(get("/api/certificates/verify/ECN-2026-999999-FAKE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid", is(false)));

        // Now mark attendance and complete event
        mvc.perform(put("/api/participation/" + partId + "/attendance").with(org)
                .contentType(MediaType.APPLICATION_JSON).content("{\"attendanceStatus\":\"PRESENT\"}"))
                .andExpect(status().isOk());

        mvc.perform(put("/api/events/" + eventId).with(org).contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"title":"Clean Rivers Initiative","description":"River cleaning","eventType":"COMMUNITY_CLEANUP",
                         "location":"Riverbank","eventDate":"%s","startTime":"08:00","endTime":"11:00",
                         "maxVolunteers":15,"requiredVolunteers":5,"status":"COMPLETED"}""".formatted(LocalDate.now().plusDays(1))))
                .andExpect(status().isOk());

        // 3. Now certificate is available
        String certJson = mvc.perform(get("/api/participation/" + partId + "/certificate").with(vol))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid", is(true)))
                .andExpect(jsonPath("$.certificateCode", startsWith("ECN-")))
                .andExpect(jsonPath("$.hours", is(3.0)))
                .andExpect(jsonPath("$.organizerName", notNullValue()))
                .andReturn().getResponse().getContentAsString();

        CertificateResponse cert = om.readValue(certJson, CertificateResponse.class);
        assertTrue(cert.valid());
        assertNotNull(cert.certificateCode());

        // 4. Verify public endpoint with real code
        mvc.perform(get("/api/certificates/verify/" + cert.certificateCode()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid", is(true)))
                .andExpect(jsonPath("$.certificateCode", is(cert.certificateCode())))
                .andExpect(jsonPath("$.eventTitle", is("Clean Rivers Initiative")));
    }
}
