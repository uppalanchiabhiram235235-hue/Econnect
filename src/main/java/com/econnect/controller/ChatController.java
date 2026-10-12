package com.econnect.controller;

import com.econnect.dto.ChatFeedResponse;
import com.econnect.dto.ChatMessageRequest;
import com.econnect.dto.ChatMessageResponse;
import com.econnect.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/events/{eventId}/chat")
    public ChatFeedResponse list(@PathVariable Long eventId,
                                 @RequestParam(required = false) Long afterId) {
        return chatService.getMessages(eventId, afterId);
    }

    @PostMapping("/events/{eventId}/chat")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse post(@PathVariable Long eventId,
                                    @Valid @RequestBody ChatMessageRequest request) {
        return chatService.postMessage(eventId, request);
    }

    @DeleteMapping("/chat/{messageId}")
    public ChatMessageResponse delete(@PathVariable Long messageId) {
        return chatService.deleteMessage(messageId);
    }

    @PutMapping("/chat/{messageId}/pin")
    public ChatMessageResponse togglePin(@PathVariable Long messageId) {
        return chatService.togglePin(messageId);
    }
}
