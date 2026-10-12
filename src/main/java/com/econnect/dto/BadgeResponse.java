package com.econnect.dto;

import com.econnect.entity.Badge;
import com.econnect.entity.UserBadge;

import java.time.LocalDate;

public record BadgeResponse(Long id, String name, String description, String criteria, LocalDate earnedDate) {

    public static BadgeResponse from(Badge b) {
        return new BadgeResponse(b.getId(), b.getBadgeName(), b.getDescription(), b.getCriteria(), null);
    }

    public static BadgeResponse from(UserBadge ub) {
        Badge b = ub.getBadge();
        return new BadgeResponse(b.getId(), b.getBadgeName(), b.getDescription(), b.getCriteria(), ub.getEarnedDate());
    }
}
