package com.econnect.service;

import com.econnect.dto.ChatFeedResponse;
import com.econnect.dto.ChatMessageRequest;
import com.econnect.dto.ChatMessageResponse;
import com.econnect.entity.*;
import com.econnect.exception.BusinessRuleException;
import com.econnect.exception.ResourceNotFoundException;
import com.econnect.repository.ChatMessageRepository;
import com.econnect.repository.EventRepository;
import com.econnect.repository.ParticipationRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessages;
    private final EventRepository events;
    private final ParticipationRepository participations;
    private final CurrentUserService currentUser;

    public ChatService(ChatMessageRepository chatMessages,
                       EventRepository events,
                       ParticipationRepository participations,
                       CurrentUserService currentUser) {
        this.chatMessages = chatMessages;
        this.events = events;
        this.participations = participations;
        this.currentUser = currentUser;
    }

    /**
     * Reusable access rule:
     * Returns true if user is the event's organizer,
     * or a volunteer whose participation is REGISTERED or COMPLETED.
     */
    public boolean canAccessChat(Event event, User user) {
        if (event == null || user == null) {
            return false;
        }
        if (event.getOrganizer().getId().equals(user.getId())) {
            return true;
        }
        return participations.findByEventIdAndUserId(event.getId(), user.getId())
                .filter(p -> p.getParticipationStatus() == ParticipationStatus.REGISTERED
                        || p.getParticipationStatus() == ParticipationStatus.COMPLETED)
                .isPresent();
    }

    @Transactional(readOnly = true)
    public ChatFeedResponse getMessages(Long eventId, Long afterId) {
        User user = currentUser.require();
        Event event = events.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        if (!canAccessChat(event, user)) {
            throw new AccessDeniedException("You must be an organizer or registered participant to access this chat");
        }

        List<ChatMessage> list;
        List<ChatMessageResponse> pinned = null;

        if (afterId != null && afterId > 0) {
            list = chatMessages.findTop100ByEventIdAndIdGreaterThanOrderByIdAsc(eventId, afterId);
        } else {
            list = chatMessages.findTop100ByEventIdOrderByIdAsc(eventId);
            pinned = chatMessages.findByEventIdAndPinnedTrueAndDeletedFalseOrderByIdAsc(eventId).stream()
                    .map(m -> ChatMessageResponse.from(m, user))
                    .toList();
        }

        List<ChatMessageResponse> messageResponses = list.stream()
                .map(m -> ChatMessageResponse.from(m, user))
                .toList();

        return new ChatFeedResponse(messageResponses, pinned != null ? pinned : List.of());
    }

    @Transactional
    public ChatMessageResponse postMessage(Long eventId, ChatMessageRequest request) {
        User user = currentUser.require();
        Event event = events.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        if (!canAccessChat(event, user)) {
            throw new AccessDeniedException("You must be an organizer or registered participant to post in this chat");
        }

        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot send messages to a cancelled event");
        }

        boolean isOrganizer = event.getOrganizer().getId().equals(user.getId());
        boolean wantPinned = Boolean.TRUE.equals(request.pinned());

        if (wantPinned && !isOrganizer) {
            throw new AccessDeniedException("Only the organizer can post pinned announcements");
        }

        LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(1);
        long count = chatMessages.countByEventIdAndSenderIdAndCreatedAtAfter(eventId, user.getId(), oneMinuteAgo);
        if (count >= 10) {
            throw new BusinessRuleException("You are sending messages too quickly. Maximum 10 messages per minute allowed.");
        }

        ChatMessage msg = new ChatMessage();
        msg.setEvent(event);
        msg.setSender(user);
        msg.setContent(request.content().trim());
        msg.setPinned(wantPinned);
        msg.setDeleted(false);
        msg.setCreatedAt(LocalDateTime.now());

        ChatMessage saved = chatMessages.save(msg);
        return ChatMessageResponse.from(saved, user);
    }

    @Transactional
    public ChatMessageResponse deleteMessage(Long messageId) {
        User user = currentUser.require();
        ChatMessage msg = chatMessages.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));

        boolean isOrganizer = msg.getEvent().getOrganizer().getId().equals(user.getId());
        boolean isSender = msg.getSender().getId().equals(user.getId());

        if (!isOrganizer && !isSender) {
            throw new AccessDeniedException("You are not authorized to delete this message");
        }

        msg.setDeleted(true);
        msg.setContent("Message removed");
        msg.setPinned(false);
        ChatMessage saved = chatMessages.save(msg);
        return ChatMessageResponse.from(saved, user);
    }

    @Transactional
    public ChatMessageResponse togglePin(Long messageId) {
        User user = currentUser.require();
        ChatMessage msg = chatMessages.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));

        boolean isOrganizer = msg.getEvent().getOrganizer().getId().equals(user.getId());
        if (!isOrganizer) {
            throw new AccessDeniedException("Only the organizer can pin or unpin messages");
        }

        if (msg.isDeleted()) {
            throw new BusinessRuleException("Cannot pin a removed message");
        }

        msg.setPinned(!msg.isPinned());
        ChatMessage saved = chatMessages.save(msg);
        return ChatMessageResponse.from(saved, user);
    }
}
