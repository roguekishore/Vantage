package com.backend.springapp.sse;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Manages per-user SSE emitters and broadcasts {@link ProgressEvent}s.
 *
 * Thread-safe: multiple extension-sync requests can fire concurrently for the
 * same user; each event is pushed to every open emitter for that userId.
 */
@Slf4j
@Service
public class ProgressEventService {

    /** userId → list of live SSE emitters (one per browser tab) */
    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    /** Timeout for each SSE connection (30 minutes, then client auto-reconnects) */
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L;

    /** Heartbeat period to keep intermediary proxies/CDNs from idling out SSE streams. */
    private static final long HEARTBEAT_SECONDS = 25L;

    private final ScheduledExecutorService heartbeatExecutor =
            Executors.newScheduledThreadPool(1, r -> {
                Thread t = new Thread(r, "sse-heartbeat");
                t.setDaemon(true);
                return t;
            });

    /**
     * Register a new SSE connection for a user.
     * Called by the controller when the React client opens an EventSource.
     */
    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        final ScheduledFuture<?> heartbeatTask = heartbeatExecutor.scheduleAtFixedRate(() -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("ping")
                        .data(Map.of("status", "alive"), MediaType.APPLICATION_JSON));
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
        }, HEARTBEAT_SECONDS, HEARTBEAT_SECONDS, TimeUnit.SECONDS);

        // Remove emitter on completion / timeout / error
        Runnable cleanup = () -> {
            heartbeatTask.cancel(true);
            List<SseEmitter> list = emitters.get(userId);
            if (list != null) {
                list.remove(emitter);
                if (list.isEmpty()) emitters.remove(userId);
            }
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        // Send an initial "connected" event so the client knows the stream is alive
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("status", "connected"), MediaType.APPLICATION_JSON));
        } catch (IOException e) {
            log.warn("Failed to send initial SSE event to user {}", userId, e);
            emitter.completeWithError(e);
        }

        log.info("SSE subscribed: userId={} (active emitters={})", userId,
                emitters.getOrDefault(userId, List.of()).size());

        return emitter;
    }

    /**
     * Broadcast a progress event to all open SSE connections for a user.
     *
     * If called from within an active database transaction, the publish is
     * deferred until AFTER the transaction commits. This prevents a race where
     * the frontend calls GET /api/me/stats immediately upon receiving the event
     * but the DB read sees pre-commit (stale) data.
     */
    public void publish(Long userId, ProgressEvent event) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            // Capture values for use in the lambda (must be effectively final)
            TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        doPublish(userId, event);
                    }
                }
            );
        } else {
            doPublish(userId, event);
        }
    }

    private void doPublish(Long userId, ProgressEvent event) {
        List<SseEmitter> list = emitters.get(userId);
        if (list == null || list.isEmpty()) {
            log.debug("No SSE subscribers for userId={}, skipping event", userId);
            return;
        }

        List<SseEmitter> dead = new java.util.ArrayList<>();
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event()
                        .name("progress-update")
                        .data(event, MediaType.APPLICATION_JSON));
            } catch (IOException e) {
                log.debug("SSE send failed for userId={}, removing emitter", userId);
                dead.add(emitter);
            }
        }
        if (!dead.isEmpty()) {
            list.removeAll(dead);
            if (list.isEmpty()) emitters.remove(userId);
        }

        log.debug("Published SSE event to {} emitter(s) for userId={}: {}", list.size(), userId, event);
    }
}
