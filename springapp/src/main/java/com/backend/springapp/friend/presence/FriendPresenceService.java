package com.backend.springapp.friend.presence;

import com.backend.springapp.friend.Friendship;
import com.backend.springapp.friend.FriendshipRepository;
import com.backend.springapp.friend.presence.dto.FriendPresenceDTO;
import com.backend.springapp.user.User;
import com.backend.springapp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendPresenceService {

    private static final long ONLINE_WINDOW_SECONDS = 75;

    private final UserPresenceRepository presenceRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    @Transactional
    public void ping(Long userId) {
        UserPresence presence = presenceRepository.findByUserId(userId).orElseGet(UserPresence::new);
        presence.setUserId(userId);
        presence.setLastActiveAt(LocalDateTime.now());
        presenceRepository.saveAndFlush(presence);
    }

    @Transactional(readOnly = true)
    public List<FriendPresenceDTO> getFriendsPresence(Long currentUserId) {
        List<Friendship> friendships = friendshipRepository.findAllForUser(currentUserId);
        List<Long> friendIds = friendships.stream()
                .map(f -> Objects.equals(f.getUserAId(), currentUserId) ? f.getUserBId() : f.getUserAId())
                .toList();

        if (friendIds.isEmpty()) return List.of();

        Map<Long, User> userMap = userRepository.findAllById(friendIds).stream()
                .collect(Collectors.toMap(User::getUid, u -> u));
        Map<Long, UserPresence> presenceMap = presenceRepository.findByUserIdIn(friendIds).stream()
                .collect(Collectors.toMap(UserPresence::getUserId, p -> p));

        LocalDateTime threshold = LocalDateTime.now().minusSeconds(ONLINE_WINDOW_SECONDS);

        return friendIds.stream()
                .map(uid -> {
                    User u = userMap.get(uid);
                    UserPresence p = presenceMap.get(uid);
                    LocalDateTime last = p != null ? p.getLastActiveAt() : null;
                    boolean online = last != null && !last.isBefore(threshold);
                    return new FriendPresenceDTO(uid, u != null ? u.getUsername() : "Unknown", online, last);
                })
                .toList();
    }
}
