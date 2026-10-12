package com.econnect.dto;

import com.econnect.entity.AttendanceStatus;
import com.econnect.entity.Participation;
import com.econnect.entity.ParticipationStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ParticipationResponse(
        Long id, Long eventId, String eventTitle, LocalDate eventDate,
        Long userId, String userName, String userEmail,
        LocalDateTime registrationDate,
        AttendanceStatus attendanceStatus, ParticipationStatus participationStatus) {

    public static ParticipationResponse from(Participation p) {
        return new ParticipationResponse(
                p.getId(), p.getEvent().getId(), p.getEvent().getTitle(), p.getEvent().getEventDate(),
                p.getUser().getId(), p.getUser().getName(), p.getUser().getEmail(),
                p.getRegistrationDate(), p.getAttendanceStatus(), p.getParticipationStatus());
    }
}
