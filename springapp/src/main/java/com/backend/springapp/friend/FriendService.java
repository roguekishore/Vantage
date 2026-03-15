package com.backend.springapp.friend;

import com.backend.springapp.friend.dto.*;
import com.backend.springapp.user.User;
import com.backend.springapp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final UserRepository userRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public Page<FriendSearchResultDTO> searchUsers(Long currentUserId, String query, int page, int size) {
        String q = query == null ? "" : query.trim();
        int safeSize = Math.min(Math.max(size, 1), 25);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by("username").ascending());

        Page<User> userPage = userRepository.findByUsernameContainingIgnoreCaseAndUidNot(q, currentUserId, pageable);
        List<FriendSearchResultDTO> mapped = userPage.getContent().stream()
                .map(u -> toSearchResult(currentUserId, u))
                .toList();

        return new PageImpl<>(mapped, pageable, userPage.getTotalElements());
    }

    @Transactional
    public FriendRequestDTO sendRequest(Long currentUserId, Long targetUserId) {
        if (targetUserId == null) {
            throw new IllegalArgumentException("targetUserId is required");
        }
        if (Objects.equals(currentUserId, targetUserId)) {
            throw new IllegalArgumentException("You cannot send a friend request to yourself");
        }

        User requester = userRepository.findById(currentUserId)
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new NoSuchElementException("Target user not found"));

        long a = Math.min(currentUserId, targetUserId);
        long b = Math.max(currentUserId, targetUserId);
        if (friendshipRepository.existsByUserAIdAndUserBId(a, b)) {
            throw new IllegalStateException("You are already friends");
        }

        List<FriendRequest> pending = friendRequestRepository.findPendingBetween(currentUserId, targetUserId);
        if (!pending.isEmpty()) {
            FriendRequest existing = pending.get(0);
            if (Objects.equals(existing.getRequesterId(), currentUserId)) {
                throw new IllegalStateException("Friend request already sent");
            }
            throw new IllegalStateException("This user has already sent you a friend request");
        }

        FriendRequest request = new FriendRequest();
        request.setRequesterId(currentUserId);
        request.setAddresseeId(targetUserId);
        request.setStatus(FriendRequestStatus.PENDING);
        FriendRequest saved = friendRequestRepository.saveAndFlush(request);

        Map<String, Object> payload = Map.of(
                "type", "FRIEND_REQUEST_RECEIVED",
                "requestId", saved.getId(),
                "fromUserId", requester.getUid(),
                "fromUsername", requester.getUsername(),
                "message", requester.getUsername() + " sent you a friend request"
        );
        broadcastSafe("/topic/friends/" + target.getUid() + "/requests", payload);

        return toFriendRequestDTO(saved, Map.of(
                requester.getUid(), requester,
                target.getUid(), target
        ));
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDTO> getIncomingRequests(Long currentUserId) {
        List<FriendRequest> requests = friendRequestRepository
                .findByAddresseeIdAndStatusOrderByCreatedAtDesc(currentUserId, FriendRequestStatus.PENDING);
        return mapRequests(requests);
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDTO> getOutgoingRequests(Long currentUserId) {
        List<FriendRequest> requests = friendRequestRepository
                .findByRequesterIdAndStatusOrderByCreatedAtDesc(currentUserId, FriendRequestStatus.PENDING);
        return mapRequests(requests);
    }

    @Transactional(readOnly = true)
    public List<FriendUserDTO> getFriends(Long currentUserId) {
        List<Friendship> friendships = friendshipRepository.findAllForUser(currentUserId);
        List<Long> friendIds = friendships.stream()
                .map(f -> Objects.equals(f.getUserAId(), currentUserId) ? f.getUserBId() : f.getUserAId())
                .toList();

        Map<Long, User> userMap = userRepository.findAllById(friendIds).stream()
                .collect(Collectors.toMap(User::getUid, u -> u));

        return friendIds.stream()
                .map(userMap::get)
                .filter(Objects::nonNull)
                .map(u -> new FriendUserDTO(u.getUid(), u.getUsername()))
                .toList();
    }

    @Transactional(readOnly = true)
    public FriendOverviewDTO getOverview(Long currentUserId) {
        List<FriendUserDTO> friends = getFriends(currentUserId);
        List<FriendRequestDTO> incoming = getIncomingRequests(currentUserId);
        List<FriendRequestDTO> outgoing = getOutgoingRequests(currentUserId);
        long incomingCount = friendRequestRepository.countByAddresseeIdAndStatus(currentUserId, FriendRequestStatus.PENDING);
        return new FriendOverviewDTO(friends, incoming, outgoing, incomingCount);
    }

    @Transactional
    public FriendRequestDTO acceptRequest(Long currentUserId, Long requestId) {
        FriendRequest request = friendRequestRepository.findByIdAndAddresseeId(requestId, currentUserId)
                .orElseThrow(() -> new NoSuchElementException("Friend request not found"));

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new IllegalStateException("Friend request is not pending");
        }

        long a = Math.min(request.getRequesterId(), request.getAddresseeId());
        long b = Math.max(request.getRequesterId(), request.getAddresseeId());
        if (!friendshipRepository.existsByUserAIdAndUserBId(a, b)) {
            Friendship friendship = new Friendship();
            friendship.setUserAId(a);
            friendship.setUserBId(b);
            friendshipRepository.save(friendship);
        }

        request.setStatus(FriendRequestStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());
        FriendRequest saved = friendRequestRepository.saveAndFlush(request);

        Map<String, Object> payload = Map.of(
                "type", "FRIEND_REQUEST_ACCEPTED",
                "requestId", saved.getId(),
                "fromUserId", saved.getAddresseeId(),
                "message", "Your friend request was accepted"
        );
        broadcastSafe("/topic/friends/" + saved.getRequesterId() + "/requests", payload);

        return toFriendRequestDTO(saved, loadUsersForRequests(List.of(saved)));
    }

    @Transactional
    public FriendRequestDTO rejectRequest(Long currentUserId, Long requestId) {
        FriendRequest request = friendRequestRepository.findByIdAndAddresseeId(requestId, currentUserId)
                .orElseThrow(() -> new NoSuchElementException("Friend request not found"));

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new IllegalStateException("Friend request is not pending");
        }

        request.setStatus(FriendRequestStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());
        FriendRequest saved = friendRequestRepository.saveAndFlush(request);
        return toFriendRequestDTO(saved, loadUsersForRequests(List.of(saved)));
    }

    @Transactional
    public void cancelRequest(Long currentUserId, Long requestId) {
        FriendRequest request = friendRequestRepository.findByIdAndRequesterId(requestId, currentUserId)
                .orElseThrow(() -> new NoSuchElementException("Friend request not found"));

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new IllegalStateException("Friend request is not pending");
        }

        request.setStatus(FriendRequestStatus.CANCELLED);
        request.setRespondedAt(LocalDateTime.now());
        friendRequestRepository.saveAndFlush(request);
    }

    @Transactional(readOnly = true)
    public long getIncomingCount(Long currentUserId) {
        return friendRequestRepository.countByAddresseeIdAndStatus(currentUserId, FriendRequestStatus.PENDING);
    }

    private FriendSearchResultDTO toSearchResult(Long currentUserId, User target) {
        long a = Math.min(currentUserId, target.getUid());
        long b = Math.max(currentUserId, target.getUid());

        if (friendshipRepository.existsByUserAIdAndUserBId(a, b)) {
            return new FriendSearchResultDTO(target.getUid(), target.getUsername(), "FRIEND", null);
        }

        List<FriendRequest> pending = friendRequestRepository.findPendingBetween(currentUserId, target.getUid());
        if (pending.isEmpty()) {
            return new FriendSearchResultDTO(target.getUid(), target.getUsername(), "NONE", null);
        }

        FriendRequest req = pending.get(0);
        if (Objects.equals(req.getRequesterId(), currentUserId)) {
            return new FriendSearchResultDTO(target.getUid(), target.getUsername(), "REQUEST_SENT", req.getId());
        }
        return new FriendSearchResultDTO(target.getUid(), target.getUsername(), "REQUEST_RECEIVED", req.getId());
    }

    private List<FriendRequestDTO> mapRequests(List<FriendRequest> requests) {
        Map<Long, User> users = loadUsersForRequests(requests);
        return requests.stream()
                .map(r -> toFriendRequestDTO(r, users))
                .toList();
    }

    private Map<Long, User> loadUsersForRequests(List<FriendRequest> requests) {
        Set<Long> ids = new HashSet<>();
        for (FriendRequest r : requests) {
            ids.add(r.getRequesterId());
            ids.add(r.getAddresseeId());
        }
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getUid, u -> u));
    }

    private FriendRequestDTO toFriendRequestDTO(FriendRequest request, Map<Long, User> users) {
        User requester = users.get(request.getRequesterId());
        User addressee = users.get(request.getAddresseeId());
        return new FriendRequestDTO(
                request.getId(),
                new FriendUserDTO(request.getRequesterId(), requester != null ? requester.getUsername() : "Unknown"),
                new FriendUserDTO(request.getAddresseeId(), addressee != null ? addressee.getUsername() : "Unknown"),
                request.getStatus().name(),
                request.getCreatedAt(),
                request.getRespondedAt()
        );
    }

    private void broadcastSafe(String destination, Object payload) {
        try {
            messagingTemplate.convertAndSend(destination, payload);
        } catch (Exception ignored) {
            // Notification failure should not break request flow.
        }
    }
}
