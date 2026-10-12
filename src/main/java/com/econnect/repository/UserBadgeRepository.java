package com.econnect.repository;

import com.econnect.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByUserIdOrderByEarnedDateAsc(Long userId);
    boolean existsByUserIdAndBadgeId(Long userId, Long badgeId);
}
