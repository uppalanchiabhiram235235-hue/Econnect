package com.econnect.dto;

import com.econnect.entity.ChatMessage;
import com.econnect.entity.Role;
import com.econnect.entity.User;

import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long id,
        Long senderId,
        String senderName,
        Role senderRole,
        String content,
        boolean pinned,
        boolean deleted,
        LocalDateTime createdAt,
        boolean mine
) {
    public static ChatMessageResponse from(ChatMessage m, User caller) {
        boolean isMine = caller != null && m.getSender().getId().equals(caller.getId());
        return new ChatMessageResponse(
                m.getId(),
                m.getSender().getId(),
                m.getSender().getName(),
                m.getSender().getRole(),
                m.getContent(),
                m.isPinned(),
                m.isDeleted(),
                m.getCreatedAt(),
                isMine
        );
    }
}
