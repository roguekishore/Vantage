package com.backend.springapp.common;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration using STOMP over SockJS.
 *
 * Endpoints:
 *   /ws                           — STOMP handshake (SockJS fallback)
 *
 * Broker destinations:
 *   /topic/battle/{id}/state      — real-time battle state pushes
 *   /topic/battle/{id}/result     — battle completion notification
 *   /topic/battle/{id}/lobby      — lobby ready-state changes
 *   /topic/queue/{userId}/matched — matchmaking success notification
 *
 * Application destinations:
 *   /app/...                      — (reserved for future client→server messages)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable a simple in-memory broker for /topic destinations
        registry.enableSimpleBroker("/topic");
        // Prefix for messages FROM the client (currently unused, reserved)
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
