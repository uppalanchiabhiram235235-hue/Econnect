package com.econnect.repository;

import com.econnect.entity.ImpactRecord;
import com.econnect.entity.ImpactType;
import com.econnect.entity.ParticipationStatus;
import com.econnect.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

public interface ImpactRepository extends JpaRepository<ImpactRecord, Long> {

    List<ImpactRecord> findByEventIdOrderByRecordedAtDesc(Long eventId);

    List<ImpactRecord> findByEventIdAndVerificationStatusOrderByRecordedAtDesc(Long eventId, VerificationStatus status);

    boolean existsByEventId(Long eventId);

    long countByVerificationStatus(VerificationStatus status);

    long countByEventIdAndVerificationStatus(Long eventId, VerificationStatus status);

    @Query("select coalesce(sum(i.quantity), 0) from ImpactRecord i " +
           "where i.impactType = :type and i.verificationStatus = :status")
    BigDecimal sumByTypeAndStatus(@Param("type") ImpactType type, @Param("status") VerificationStatus status);

    @Query("select coalesce(sum(i.quantity), 0) from ImpactRecord i " +
           "where i.event.id = :eventId and i.verificationStatus = :status")
    BigDecimal sumForEvent(@Param("eventId") Long eventId, @Param("status") VerificationStatus status);

    /** Verified impact of all events the user completed. */
    @Query("select coalesce(sum(i.quantity), 0) from ImpactRecord i " +
           "where i.verificationStatus = :v and i.event.id in " +
           "(select p.event.id from Participation p where p.user.id = :uid and p.participationStatus = :ps)")
    BigDecimal sumVerifiedForUser(@Param("uid") Long userId,
                                  @Param("ps") ParticipationStatus participationStatus,
                                  @Param("v") VerificationStatus verification);

    @Query("select coalesce(sum(i.quantity), 0) from ImpactRecord i " +
           "where i.verificationStatus = :v and i.impactType in :types and i.event.id in " +
           "(select p.event.id from Participation p where p.user.id = :uid and p.participationStatus = :ps)")
    BigDecimal sumVerifiedForUserByTypes(@Param("uid") Long userId,
                                         @Param("ps") ParticipationStatus participationStatus,
                                         @Param("v") VerificationStatus verification,
                                         @Param("types") Collection<ImpactType> types);
}
