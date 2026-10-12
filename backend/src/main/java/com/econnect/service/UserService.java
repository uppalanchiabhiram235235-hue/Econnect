package com.econnect.service;

import com.econnect.dto.*;
import com.econnect.entity.*;
import com.econnect.exception.ResourceNotFoundException;
import com.econnect.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository users;
    private final ParticipationRepository participations;
    private final ImpactRepository impacts;
    private final UserBadgeRepository userBadges;
    private final CurrentUserService currentUser;

    public UserService(UserRepository users, ParticipationRepository participations, ImpactRepository impacts,
                       UserBadgeRepository userBadges, CurrentUserService currentUser) {
        this.users = users;
        this.participations = participations;
        this.impacts = impacts;
        this.userBadges = userBadges;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public UserResponse get(Long id) {
        return UserResponse.from(find(id));
    }

    @Transactional
    public UserResponse update(Long id, UserUpdateRequest r) {
        User u = find(id);
        requireSelf(id);
        u.setName(r.name().trim());
        u.setPhone(r.phone());
        u.setLocation(r.location());
        return UserResponse.from(users.save(u));
    }

    @Transactional(readOnly = true)
    public List<BadgeResponse> badges(Long id) {
        find(id);
        return userBadges.findByUserIdOrderByEarnedDateAsc(id).stream().map(BadgeResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public UserStatistics statistics(Long id) {
        User u = find(id);
        requireSelf(id);

        long joined = participations.countByUserIdAndParticipationStatusNot(id, ParticipationStatus.CANCELLED);
        long completed = participations.countByUserIdAndParticipationStatus(id, ParticipationStatus.COMPLETED);
        var impact = impacts.sumVerifiedForUser(id, ParticipationStatus.COMPLETED, VerificationStatus.VERIFIED);

        List<Participation> all = participations.findByUserIdOrderByRegistrationDateDesc(id);
        List<ParticipationResponse> recent = all.stream().limit(5).map(ParticipationResponse::from).toList();
        List<ParticipationResponse> upcoming = all.stream()
                .filter(p -> p.getParticipationStatus() == ParticipationStatus.REGISTERED
                        && p.getEvent().getStatus() == EventStatus.UPCOMING)
                .map(ParticipationResponse::from).toList();

        var next = u.getLevel().next();
        return new UserStatistics(id, u.getPoints(), u.getLevel().getLabel(),
                next.map(VolunteerLevel::getLabel).orElse(null),
                next.map(n -> n.getMinPoints() - u.getPoints()).orElse(null),
                joined, completed, impact, badges(id), recent, upcoming);
    }

    private User find(Long id) {
        return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private void requireSelf(Long id) {
        if (!currentUser.require().getId().equals(id)) {
            throw new AccessDeniedException("You can only access your own account data");
        }
    }
}
