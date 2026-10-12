package com.econnect.repository;

import com.econnect.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findTop100ByEventIdAndIdGreaterThanOrderByIdAsc(Long eventId, Long afterId);

    List<ChatMessage> findTop100ByEventIdOrderByIdAsc(Long eventId);

    List<ChatMessage> findByEventIdAndPinnedTrueAndDeletedFalseOrderByIdAsc(Long eventId);

    long countByEventIdAndSenderIdAndCreatedAtAfter(Long eventId, Long senderId, LocalDateTime after);
}
