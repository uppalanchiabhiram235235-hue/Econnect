package com.econnect.repository;

import com.econnect.entity.Role;
import com.econnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(Role role);
    java.util.List<User> findByRole(Role role);
}
