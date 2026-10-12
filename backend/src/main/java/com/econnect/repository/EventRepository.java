package com.econnect.repository;

import com.econnect.entity.Event;
import com.econnect.entity.EventStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    long countByStatus(EventStatus status);

    long countByOrganizerId(Long organizerId);

    long countByOrganizerIdAndStatus(Long organizerId, EventStatus status);

    List<Event> findByOrganizerIdOrderByEventDateDesc(Long organizerId);

    List<Event> findByStatusOrderByEventDateAsc(EventStatus status, Pageable pageable);

    List<Event> findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNull(EventStatus status);

    /** Row lock so two volunteers cannot take the last slot at the same time. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Event e where e.id = :id")
    Optional<Event> findByIdForUpdate(@Param("id") Long id);
}
