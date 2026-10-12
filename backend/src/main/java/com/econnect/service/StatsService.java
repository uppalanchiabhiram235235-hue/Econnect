package com.econnect.service;

import com.econnect.dto.CommunityImpact;
import com.econnect.dto.OrganizerStatistics;
import com.econnect.entity.*;
import com.econnect.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatsService {

    private final UserRepository users;
    private final EventRepository events;
    private final ParticipationRepository participations;
    private final ImpactRepository impacts;
    private final CurrentUserService currentUser;

    public StatsService(UserRepository users, EventRepository events, ParticipationRepository participations,
                        ImpactRepository impacts, CurrentUserService currentUser) {
        this.users = users;
        this.events = events;
        this.participations = participations;
        this.impacts = impacts;
        this.currentUser = currentUser;
    }

    /** Public landing-page totals: VERIFIED impact only. */
    @Transactional(readOnly = true)
    public CommunityImpact community() {
        return new CommunityImpact(
                users.countByRole(Role.VOLUNTEER),
                events.countByStatus(EventStatus.COMPLETED),
                impacts.sumByTypeAndStatus(ImpactType.TREES_PLANTED, VerificationStatus.VERIFIED),
                impacts.sumByTypeAndStatus(ImpactType.WASTE_COLLECTED, VerificationStatus.VERIFIED),
                impacts.countByVerificationStatus(VerificationStatus.VERIFIED));
    }

    @Transactional(readOnly = true)
    public OrganizerStatistics organizer(Long organizerId) {
        if (!currentUser.require().getId().equals(organizerId)) {
            throw new AccessDeniedException("You can only view your own organizer statistics");
        }
        return new OrganizerStatistics(
                events.countByOrganizerId(organizerId),
                events.countByOrganizerIdAndStatus(organizerId, EventStatus.UPCOMING),
                events.countByOrganizerIdAndStatus(organizerId, EventStatus.COMPLETED),
                participations.countActiveByOrganizer(organizerId, ParticipationStatus.CANCELLED),
                participations.countByOrganizerAndAttendance(organizerId, AttendanceStatus.PRESENT),
                participations.countByOrganizerAndAttendance(organizerId, AttendanceStatus.ABSENT),
                impacts.countByVerificationStatus(VerificationStatus.VERIFIED));
    }
}
