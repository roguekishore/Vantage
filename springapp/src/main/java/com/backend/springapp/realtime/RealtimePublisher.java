package com.backend.springapp.realtime;

import com.backend.springapp.sse.ProgressEvent;
import com.backend.springapp.sse.ProgressEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

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
    private final ObjectProvider<RealtimeRedisBridge> bridgeProvider;

    /**
     * Send a STOMP message, swallowing any exceptions so business logic is never disrupted by WebSocket
     * failures. With the Redis bridge on, publishes to Redis (every instance, this one included, then delivers
     * locally); if the publish fails it degrades to local delivery.
     */
    public void toTopic(String dest, Object payload) {
        RealtimeRedisBridge bridge = bridgeProvider.getIfAvailable();
        if (bridge != null) {
            try {
                bridge.publishStomp(dest, payload);
                return;
            } catch (Exception e) {
                log.warn("Redis publish of {} failed, delivering locally: {}", dest, e.getMessage());
            }
        }
        try {
            messagingTemplate.convertAndSend(dest, payload);
        } catch (Exception e) {
            log.warn("WebSocket broadcast to {} failed: {}", dest, e.getMessage());
        }
    }

    /** Push a progress event to the user's open SSE streams (deferred until commit inside a transaction). */
    public void toUserSse(long userId, ProgressEvent event) {
        RealtimeRedisBridge bridge = bridgeProvider.getIfAvailable();
        if (bridge == null) {
            progressEventService.deliverLocal(userId, event);
            return;
        }
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            // keep the "after commit" guarantee: the listener thread has no transaction to defer on
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publishSse(bridge, userId, event);
                }
            });
        } else {
            publishSse(bridge, userId, event);
        }
    }

    private void publishSse(RealtimeRedisBridge bridge, long userId, ProgressEvent event) {
        try {
            bridge.publishSse(userId, event);
        } catch (Exception e) {
            log.warn("Redis publish of SSE event for user {} failed, delivering locally: {}", userId, e.getMessage());
            // may run inside afterCommit, where deliverLocal would register a synchronization that never fires
            progressEventService.deliverLocalNow(userId, event);
        }
    }
}
