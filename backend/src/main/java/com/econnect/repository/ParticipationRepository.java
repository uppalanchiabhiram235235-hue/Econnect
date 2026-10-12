package com.econnect.repository;

import com.econnect.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ParticipationRepository extends JpaRepository<Participation, Long> {

    Optional<Participation> findByEventIdAndUserId(Long eventId, Long userId);

    long countByEventIdAndParticipationStatusNot(Long eventId, ParticipationStatus status);

    List<Participation> findByEventIdOrderByRegistrationDateAsc(Long eventId);

    List<Participation> findByUserIdOrderByRegistrationDateDesc(Long userId);

    long countByUserIdAndParticipationStatusNot(Long userId, ParticipationStatus status);

    long countByUserIdAndParticipationStatus(Long userId, ParticipationStatus status);

    boolean existsByEventId(Long eventId);

    @Query("select count(p) from Participation p where p.user.id = :uid " +
           "and p.participationStatus = :status and p.event.eventType in :types")
    long countByUserAndStatusAndEventTypes(@Param("uid") Long userId,
                                           @Param("status") ParticipationStatus status,
                                           @Param("types") Collection<EventType> types);

    @Query("select count(p) from Participation p where p.event.organizer.id = :oid " +
           "and p.participationStatus <> :excluded")
    long countActiveByOrganizer(@Param("oid") Long organizerId,
                                @Param("excluded") ParticipationStatus excluded);

    @Query("select count(p) from Participation p where p.event.organizer.id = :oid " +
           "and p.attendanceStatus = :attendance")
    long countByOrganizerAndAttendance(@Param("oid") Long organizerId,
                                       @Param("attendance") AttendanceStatus attendance);
}
