package com.backend.springapp.common;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * STOMP-level authentication/authorization guard.
 *
 * - CONNECT: authenticates user from Authorization header (Bearer) or
 *   handshake session attribute populated from auth cookie.
 * - SUBSCRIBE: enforces that user-scoped /topic destinations can only be
 *   subscribed by that same authenticated user.
 */
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final Pattern QUEUE_MATCHED = Pattern.compile("^/topic/queue/(\\d+)/matched$");
    private static final Pattern FRIENDS = Pattern.compile("^/topic/friends/(\\d+)/(requests|challenges)$");
    private static final Pattern BATTLE_USER_SCOPED = Pattern.compile(
            "^/topic/battle/\\d+/(lobby|state|result|group-state|group-result|kicked)/(\\d+)$");

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();
        if (command == null) return message;

        if (StompCommand.CONNECT.equals(command)) {
            Long uid = extractUidFromConnect(accessor);
            if (uid == null) {
                throw new IllegalArgumentException("WebSocket authentication required");
            }
            accessor.setUser(principal(uid));
            Map<String, Object> attrs = accessor.getSessionAttributes();
            if (attrs != null) {
                attrs.put(JwtAuthFilter.JWT_USER_ID_ATTR, uid);
            }
            return message;
        }

        if (StompCommand.SUBSCRIBE.equals(command)) {
            Long authUid = resolveAuthenticatedUid(accessor);
            if (authUid == null) {
                throw new IllegalArgumentException("Unauthenticated STOMP subscription");
            }

            String destination = accessor.getDestination();
            Long scopedUid = extractScopedUid(destination);
            if (scopedUid != null && !authUid.equals(scopedUid)) {
                throw new IllegalArgumentException("Forbidden STOMP subscription");
            }
        }

        return message;
    }

    private Long extractUidFromConnect(StompHeaderAccessor accessor) {
        String auth = accessor.getFirstNativeHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7).trim();
            if (!token.isBlank() && jwtUtil.isValid(token)) {
                return jwtUtil.extractUserId(token);
            }
        }

        Map<String, Object> attrs = accessor.getSessionAttributes();
        if (attrs != null) {
            Object value = attrs.get(JwtAuthFilter.JWT_USER_ID_ATTR);
            if (value instanceof Long id) return id;
            if (value instanceof String s) {
                try {
                    return Long.parseLong(s);
                } catch (NumberFormatException ignored) {
                    // no-op
                }
            }
        }
        return null;
    }

    private Long resolveAuthenticatedUid(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        if (principal != null) {
            try {
                return Long.parseLong(principal.getName());
            } catch (NumberFormatException ignored) {
                // no-op
            }
        }

        Map<String, Object> attrs = accessor.getSessionAttributes();
        if (attrs != null) {
            Object value = attrs.get(JwtAuthFilter.JWT_USER_ID_ATTR);
            if (value instanceof Long id) return id;
            if (value instanceof String s) {
                try {
                    return Long.parseLong(s);
                } catch (NumberFormatException ignored) {
                    // no-op
                }
            }
        }
        return null;
    }

    private Long extractScopedUid(String destination) {
        if (destination == null || destination.isBlank()) return null;

        Matcher m1 = QUEUE_MATCHED.matcher(destination);
        if (m1.matches()) return Long.parseLong(m1.group(1));

        Matcher m2 = FRIENDS.matcher(destination);
        if (m2.matches()) return Long.parseLong(m2.group(1));

        Matcher m3 = BATTLE_USER_SCOPED.matcher(destination);
        if (m3.matches()) return Long.parseLong(m3.group(2));

        // Non user-scoped topics (e.g., /room, /started) are allowed.
        return null;
    }

    private Principal principal(Long uid) {
        return () -> String.valueOf(uid);
    }
}
