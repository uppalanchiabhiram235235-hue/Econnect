package com.econnect.service;

import com.econnect.entity.Event;
import com.econnect.entity.User;
import com.econnect.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CurrentUserService {

    private final UserRepository users;

    public CurrentUserService(UserRepository users) {
        this.users = users;
    }

    public Optional<User> find() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || !a.isAuthenticated() || a instanceof AnonymousAuthenticationToken) {
            return Optional.empty();
        }
        return users.findByEmail(a.getName());
    }

    public User require() {
        return find().orElseThrow(() -> new AccessDeniedException("Authentication required"));
    }

    /** Returns the current user if they own the event, otherwise denies access. */
    public User requireOwnerOf(Event event) {
        User u = require();
        if (!event.getOrganizer().getId().equals(u.getId())) {
            throw new AccessDeniedException("Only the organizer who owns this event can perform this action");
        }
        return u;
    }
}
