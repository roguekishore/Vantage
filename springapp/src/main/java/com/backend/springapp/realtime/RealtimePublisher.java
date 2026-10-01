package com.backend.springapp.realtime;

import com.backend.springapp.sse.ProgressEvent;
import com.backend.springapp.sse.ProgressEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * The single place that sends realtime messages (STOMP topics and per-user SSE).
 * Local-only implementation: delivers on this instance.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;
    private final ProgressEventService progressEventService;

    /**
     * Send a STOMP message, swallowing any exceptions so business logic is never
     * disrupted by WebSocket failures.
     */
    public void toTopic(String dest, Object payload) {
        try {
            messagingTemplate.convertAndSend(dest, payload);
        } catch (Exception e) {
            log.warn("WebSocket broadcast to {} failed: {}", dest, e.getMessage());
        }
    }

    /** Push a progress event to the user's open SSE streams (deferred until commit inside a transaction). */
    public void toUserSse(long userId, ProgressEvent event) {
        progressEventService.deliverLocal(userId, event);
    }
}
