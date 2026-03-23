package com.backend.springapp.common;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

/**
 * WebSocket configuration using STOMP over SockJS.
 *
 * Endpoints:
 *   /ws                           - STOMP handshake (SockJS fallback)
 *
 * Broker destinations:
 *   /topic/battle/{id}/state      - real-time battle state pushes
 *   /topic/battle/{id}/result     - battle completion notification
 *   /topic/battle/{id}/lobby      - lobby ready-state changes
 *   /topic/queue/{userId}/matched - matchmaking success notification
 *
 * Application destinations:
 *   /app/...                      - (reserved for future client→server messages)
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketHandshakeAuthInterceptor handshakeAuthInterceptor;
    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    @Value("${cors.allowed-origins:http://localhost:3000,https://localhost:3000}")
    private String allowedOriginsRaw;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable a simple in-memory broker for /topic destinations
        registry.enableSimpleBroker("/topic");
        // Prefix for messages FROM the client (currently unused, reserved)
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = Arrays.stream(allowedOriginsRaw.split(","))
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .toArray(String[]::new);

        registry.addEndpoint("/ws")
            .setAllowedOrigins(origins)
                .addInterceptors(handshakeAuthInterceptor)
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor);
    }
}
