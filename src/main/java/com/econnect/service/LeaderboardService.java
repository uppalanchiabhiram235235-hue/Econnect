package com.econnect.service;

import com.econnect.dto.LeaderboardEntryResponse;
import com.econnect.dto.LeaderboardScope;
import com.econnect.dto.UserRankResponse;
import com.econnect.entity.*;
import com.econnect.repository.ImpactRepository;
import com.econnect.repository.ParticipationRepository;
import com.econnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

@Service
public class LeaderboardService {

    private final UserRepository users;
    private final ParticipationRepository participations;
    private final ImpactRepository impacts;
    private final CurrentUserService currentUser;

    public LeaderboardService(UserRepository users,
                              ParticipationRepository participations,
                              ImpactRepository impacts,
                              CurrentUserService currentUser) {
        this.users = users;
        this.participations = participations;
        this.impacts = impacts;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryResponse> getLeaderboard(LeaderboardScope scope, Integer limit) {
        int max = (limit != null && limit > 0) ? Math.min(limit, 100) : 10;
        List<User> volunteers = users.findByRole(Role.VOLUNTEER);

        List<VolunteerStats> statsList = new ArrayList<>();
        YearMonth currentYm = YearMonth.now();
        LocalDateTime monthStart = currentYm.atDay(1).atStartOfDay();
        LocalDateTime monthEnd = currentYm.atEndOfMonth().atTime(23, 59, 59);

        for (User u : volunteers) {
            List<Participation> userParts = participations.findByUserIdOrderByRegistrationDateDesc(u.getId());
            int pts = 0;
            long completedCount = 0;
            double impactTotal = 0.0;

            if (scope == LeaderboardScope.THIS_MONTH) {
                for (Participation p : userParts) {
                    boolean monthCompleted = p.getParticipationStatus() == ParticipationStatus.COMPLETED
                            && p.getCompletedAt() != null
                            && !p.getCompletedAt().isBefore(monthStart)
                            && !p.getCompletedAt().isAfter(monthEnd);

                    boolean monthPresent = p.getAttendanceStatus() == AttendanceStatus.PRESENT
                            && p.getEvent() != null
                            && p.getEvent().getEventDate() != null
                            && !p.getEvent().getEventDate().isBefore(currentYm.atDay(1))
                            && !p.getEvent().getEventDate().isAfter(currentYm.atEndOfMonth());

                    if (monthCompleted) {
                        completedCount++;
                        pts += GamificationService.COMPLETE_POINTS;
                        BigDecimal sum = impacts.sumForEvent(p.getEvent().getId(), VerificationStatus.VERIFIED);
                        if (sum != null) impactTotal += sum.doubleValue();
                    }
                    if (monthPresent) {
                        pts += GamificationService.ATTEND_POINTS;
                    }
                }
            } else {
                // ALL_TIME
                pts = u.getPoints();
                completedCount = participations.countByUserIdAndParticipationStatus(u.getId(), ParticipationStatus.COMPLETED);
                BigDecimal sum = impacts.sumVerifiedForUser(u.getId(), ParticipationStatus.COMPLETED, VerificationStatus.VERIFIED);
                if (sum != null) impactTotal = sum.doubleValue();
            }

            LocalDateTime earliestReg = userParts.isEmpty() ? u.getCreatedAt() :
                    userParts.stream()
                            .map(Participation::getRegistrationDate)
                            .filter(Objects::nonNull)
                            .min(LocalDateTime::compareTo)
                            .orElse(u.getCreatedAt());

            statsList.add(new VolunteerStats(u, pts, completedCount, impactTotal, earliestReg));
        }

        // Ties break by eventsCompleted then earliest registration
        statsList.sort((a, b) -> {
            int cmpPts = Integer.compare(b.points(), a.points());
            if (cmpPts != 0) return cmpPts;
            int cmpCompleted = Long.compare(b.completed(), a.completed());
            if (cmpCompleted != 0) return cmpCompleted;
            return a.earliestRegistration().compareTo(b.earliestRegistration());
        });

        List<LeaderboardEntryResponse> result = new ArrayList<>();
        int rank = 1;
        for (int i = 0; i < Math.min(statsList.size(), max); i++) {
            VolunteerStats s = statsList.get(i);
            result.add(new LeaderboardEntryResponse(
                    rank++,
                    s.user().getId(),
                    s.user().getName(),
                    s.user().getLevel().getLabel(),
                    s.points(),
                    s.completed(),
                    Math.round(s.impactTotal() * 100.0) / 100.0
            ));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public UserRankResponse getCurrentUserRank() {
        User user = currentUser.require();
        List<LeaderboardEntryResponse> all = getLeaderboard(LeaderboardScope.ALL_TIME, 1000);

        Integer myRank = null;
        Integer pointsToNext = null;
        int myPoints = user.getPoints();

        for (int i = 0; i < all.size(); i++) {
            LeaderboardEntryResponse entry = all.get(i);
            if (entry.userId().equals(user.getId())) {
                myRank = entry.rank();
                myPoints = entry.points();
                if (i > 0) {
                    pointsToNext = all.get(i - 1).points() - myPoints;
                } else {
                    pointsToNext = 0;
                }
                break;
            }
        }

        return new UserRankResponse(myRank, myPoints, pointsToNext, all.size());
    }

    private record VolunteerStats(User user, int points, long completed, double impactTotal, LocalDateTime earliestRegistration) {}
}
