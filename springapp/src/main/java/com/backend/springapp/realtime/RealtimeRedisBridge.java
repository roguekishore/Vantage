package com.backend.springapp.realtime;

import com.backend.springapp.sse.ProgressEvent;
import com.backend.springapp.sse.ProgressEventService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.nio.charset.StandardCharsets;

/**
 * Redis pub/sub side of the realtime bridge. Only exists when vantage.realtime.redis.enabled=true.
 * Publishes every envelope to the shared channel and, as the channel listener, delivers every envelope
 * (the origin's own included) to this instance's local STOMP broker / SSE emitters.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "vantage.realtime.redis.enabled", havingValue = "true")
public class RealtimeRedisBridge implements MessageListener {

    static final int VERSION = 1;

    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final ProgressEventService progressEventService;
    private final String channel;
    private final String instanceId;

    public RealtimeRedisBridge(StringRedisTemplate redis,
                               ObjectMapper mapper,
                               SimpMessagingTemplate messagingTemplate,
                               ProgressEventService progressEventService,
                               @Value("${vantage.realtime.redis.channel}") String channel,
                               @Value("${vantage.instance-id}") String instanceId) {
        this.redis = redis;
        this.mapper = mapper;
        this.messagingTemplate = messagingTemplate;
        this.progressEventService = progressEventService;
        this.channel = channel;
        this.instanceId = instanceId;
    }

    public String channel() {
        return channel;
    }

    /** Throws on serialization or Redis failure so the caller can fall back to local delivery. */
    void publishStomp(String dest, Object payload) {
        ObjectNode env = envelope("stomp");
        env.put("dest", dest);
        env.putNull("userId");
        env.set("payload", mapper.valueToTree(payload));
        redis.convertAndSend(channel, mapper.writeValueAsString(env));
    }

    void publishSse(long userId, ProgressEvent event) {
        ObjectNode env = envelope("sse");
        env.putNull("dest");
        env.put("userId", userId);
        env.set("payload", mapper.valueToTree(event));
        redis.convertAndSend(channel, mapper.writeValueAsString(env));
    }

    private ObjectNode envelope(String kind) {
        ObjectNode env = mapper.createObjectNode();
        env.put("v", VERSION);
        env.put("origin", instanceId);
        env.put("kind", kind);
        return env;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            JsonNode env = mapper.readTree(new String(message.getBody(), StandardCharsets.UTF_8));
            if (env.path("v").asInt() != VERSION) {
                log.warn("Ignoring realtime message with unsupported version {}", env.path("v"));
                return;
            }
            String kind = env.path("kind").asString();
            JsonNode payload = env.get("payload");
            if ("stomp".equals(kind)) {
                messagingTemplate.convertAndSend(env.path("dest").asString(), payload);
            } else if ("sse".equals(kind)) {
                progressEventService.deliverLocal(env.path("userId").asLong(),
                        mapper.treeToValue(payload, ProgressEvent.class));
            } else {
                log.warn("Ignoring realtime message of unknown kind {}", kind);
            }
        } catch (Exception e) {
            log.warn("Failed to deliver bridged realtime message: {}", e.getMessage());
        }
    }
}
