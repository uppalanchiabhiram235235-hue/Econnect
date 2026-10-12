package com.econnect.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Junction entity: users <-> events (table event_participants). */
@Entity
@Table(name = "event_participants",
        uniqueConstraints = @UniqueConstraint(name = "uk_event_user", columnNames = {"event_id", "user_id"}))
@Getter @Setter @NoArgsConstructor
public class Participation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "registration_date", nullable = false)
    private LocalDateTime registrationDate = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 20)
    private AttendanceStatus attendanceStatus = AttendanceStatus.NOT_MARKED;

    @Enumerated(EnumType.STRING)
    @Column(name = "participation_status", nullable = false, length = 20)
    private ParticipationStatus participationStatus = ParticipationStatus.REGISTERED;

    /** Guards so points are never awarded twice for the same participation. */
    @Column(name = "attendance_points_awarded", nullable = false)
    private boolean attendancePointsAwarded = false;

    @Column(name = "completion_points_awarded", nullable = false)
    private boolean completionPointsAwarded = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
