package com.econnect.dto;

import java.util.List;

public record ChatFeedResponse(
        List<ChatMessageResponse> messages,
        List<ChatMessageResponse> pinned
) {
}
