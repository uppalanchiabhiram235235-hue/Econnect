package com.econnect.service;

import com.econnect.config.BadgeNames;
import com.econnect.entity.*;
import com.econnect.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Rule-based points, levels and badges. All rules live here, not in React or the DB. */
@Service
public class GamificationService {

    public static final int ATTEND_POINTS = 10;
    public static final int COMPLETE_POINTS = 20;

    private final UserRepository users;
    private final BadgeRepository badges;
    private final UserBadgeRepository userBadges;
    private final ParticipationRepository participations;
    private final ImpactRepository impacts;

    public GamificationService(UserRepository users, BadgeRepository badges, UserBadgeRepository userBadges,
                               ParticipationRepository participations, ImpactRepository impacts) {
        this.users = users;
        this.badges = badges;
        this.userBadges = userBadges;
        this.participations = participations;
        this.impacts = impacts;
    }

    @Transactional
    public void addPoints(User user, int points) {
        user.setPoints(user.getPoints() + points);
        user.setLevel(VolunteerLevel.forPoints(user.getPoints()));
        users.save(user);
    }

    @Transactional
    public void evaluateBadges(User user) {
        Long uid = user.getId();
        long completed = participations.countByUserIdAndParticipationStatus(uid, ParticipationStatus.COMPLETED);
        long environmental = participations.countByUserAndStatusAndEventTypes(
                uid, ParticipationStatus.COMPLETED, EventType.environmentalTypes());
        BigDecimal envImpact = impacts.sumVerifiedForUserByTypes(
                uid, ParticipationStatus.COMPLETED, VerificationStatus.VERIFIED, ImpactType.environmental());

        if (completed >= 1) award(user, BadgeNames.FIRST_STEP);
        if (completed >= 3) award(user, BadgeNames.COMMUNITY_HELPER);
        if (environmental >= 2) award(user, BadgeNames.GREEN_CHAMPION);
        if (envImpact.compareTo(BigDecimal.valueOf(50)) >= 0) award(user, BadgeNames.ECO_WARRIOR);
        if (completed >= 5) award(user, BadgeNames.CAUSE_LEADER);
        if (completed >= 10 && user.getPoints() >= 300) award(user, BadgeNames.COMMUNITY_HERO);
    }

    /** Verified impact can unlock impact-based badges for everyone who completed the event. */
    @Transactional
    public void onImpactVerified(Event event) {
        participations.findByEventIdOrderByRegistrationDateAsc(event.getId()).stream()
                .filter(p -> p.getParticipationStatus() == ParticipationStatus.COMPLETED)
                .forEach(p -> evaluateBadges(p.getUser()));
    }

    private void award(User user, String badgeName) {
        badges.findByBadgeName(badgeName).ifPresent(badge -> {
            if (!userBadges.existsByUserIdAndBadgeId(user.getId(), badge.getId())) {
                UserBadge ub = new UserBadge();
                ub.setUser(user);
                ub.setBadge(badge);
                ub.setEarnedDate(LocalDate.now());
                userBadges.save(ub);
            }
        });
    }
}
