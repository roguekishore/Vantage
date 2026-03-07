package com.backend.springapp.user;

import com.backend.springapp.gamification.leaderboard.Institution;
import com.backend.springapp.gamification.leaderboard.InstitutionRepository;
import com.backend.springapp.user.dto.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.springapp.common.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final InstitutionRepository institutionRepository;
    private final UserProgressRepository progressRepository;
    private final JwtUtil jwtUtil;

    /** BCrypt encoder for password hashing (Phase 1). */
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ─── Mapping ─────────────────────────────────────────────────────────────

    /** Map User → response DTO (no JWT token). Used by CRUD endpoints. */
    private UserResponseDTO toResponse(User user) {
        return toResponse(user, null);
    }

    /** Map User → response DTO with optional JWT token. Used by login/signup. */
    private UserResponseDTO toResponse(User user, String jwtToken) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setUid(user.getUid());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setLcusername(user.getLcusername());
        dto.setSessionToken(user.getSessionToken());
        dto.setToken(jwtToken); // Phase 2: null for non-auth calls, populated for login/signup
        dto.setGraduationYear(user.getGraduationYear());
        dto.setRating(user.getRating());
        if (user.getInstitution() != null) {
            dto.setInstitutionId(user.getInstitution().getId());
            dto.setInstitutionName(user.getInstitution().getName());
        }
        return dto;
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────

    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public UserResponseDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
        return toResponse(user);
    }

    @Transactional
    public UserResponseDTO createUser(UserRequestDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already in use: " + dto.getEmail());
        }
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Username already taken: " + dto.getUsername());
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setLcusername(dto.getLcusername());
        user.setGraduationYear(dto.getGraduationYear());
        if (dto.getInstitutionId() != null) {
            Institution institution = institutionRepository.findById(dto.getInstitutionId())
                    .orElseThrow(() -> new EntityNotFoundException("Institution not found with id: " + dto.getInstitutionId()));
            user.setInstitution(institution);
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponseDTO updateUser(Long id, UserRequestDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        // Allow changing email only if it's not taken by another user
        if (!user.getEmail().equals(dto.getEmail()) && userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already in use: " + dto.getEmail());
        }
        if (!user.getUsername().equals(dto.getUsername()) && userRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Username already taken: " + dto.getUsername());
        }

        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setLcusername(dto.getLcusername());
        user.setGraduationYear(dto.getGraduationYear());
        if (dto.getInstitutionId() != null) {
            Institution institution = institutionRepository.findById(dto.getInstitutionId())
                    .orElseThrow(() -> new EntityNotFoundException("Institution not found with id: " + dto.getInstitutionId()));
            user.setInstitution(institution);
        } else {
            user.setInstitution(null);
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException("User not found with id: " + id);
        }
        progressRepository.deleteAllByUserId(id);
        userRepository.deleteById(id);
    }

    // ─── Auth ────────────────────────────────────────────────────────────────

    @Transactional
    public UserResponseDTO login(LoginRequestDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            // Already BCrypt-hashed — good
        } else if (user.getPassword().equals(dto.getPassword())) {
            // Legacy plain-text password — hash it now (auto-migration)
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        } else {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Issue a fresh session token on every login
        user.setSessionToken(UUID.randomUUID().toString());
        userRepository.save(user);

        // Phase 2: dual-issue JWT alongside the legacy sessionToken
        String jwt = jwtUtil.generateToken(user.getUid(), user.getUsername(), user.getEmail());
        return toResponse(user, jwt);
    }

    /**
     * Resolve a session token to the owning User entity.
     * Used by SyncController to authenticate extension requests.
     */
    public User resolveToken(String token) {
        if (token == null || token.isBlank()) return null;
        return userRepository.findBySessionToken(token).orElse(null);
    }

    @Transactional
    public UserResponseDTO signup(SignupRequestDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already in use: " + dto.getEmail());
        }
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Username already taken: " + dto.getUsername());
        }
        if (dto.getLcusername() != null && !dto.getLcusername().isBlank()
                && userRepository.existsByLcusername(dto.getLcusername())) {
            throw new IllegalArgumentException("LeetCode username already linked to another account: " + dto.getLcusername());
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setSessionToken(UUID.randomUUID().toString());
        if (dto.getLcusername() != null && !dto.getLcusername().isBlank()) {
            user.setLcusername(dto.getLcusername().trim());
        }
        user.setGraduationYear(dto.getGraduationYear());
        if (dto.getInstitutionId() != null) {
            Institution institution = institutionRepository.findById(dto.getInstitutionId())
                    .orElseThrow(() -> new EntityNotFoundException("Institution not found with id: " + dto.getInstitutionId()));
            user.setInstitution(institution);
        }

        User saved = userRepository.save(user);
        // Phase 2: dual-issue JWT alongside the legacy sessionToken
        String jwt = jwtUtil.generateToken(saved.getUid(), saved.getUsername(), saved.getEmail());
        return toResponse(saved, jwt);
    }
}
