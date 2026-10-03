package com.backend.springapp.user;

import com.backend.springapp.common.AdminTokenGuard;
import com.backend.springapp.user.dto.UserRequestDTO;
import com.backend.springapp.user.dto.UserResponseDTO;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AdminTokenGuard adminGuard;

    /** GET /api/users - list all users (admin only) */
    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers(HttpServletRequest request) {
        adminGuard.requireAdmin(request);
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /** GET /api/users/{id} - get one user (that user, or admin) */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id, HttpServletRequest request) {
        adminGuard.requireSelfOrAdmin(request, id);
        try {
            return ResponseEntity.ok(userService.getUserById(id));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/users - create user (admin only; signup is /api/auth/signup) */
    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody UserRequestDTO dto, HttpServletRequest request) {
        adminGuard.requireAdmin(request);
        try {
            UserResponseDTO created = userService.createUser(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /** PUT /api/users/{id} - update user */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UserRequestDTO dto,
                                        HttpServletRequest request) {
        adminGuard.requireSelfOrAdmin(request, id);
        try {
            return ResponseEntity.ok(userService.updateUser(id, dto));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /** DELETE /api/users/{id} - delete user */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, HttpServletRequest request) {
        adminGuard.requireSelfOrAdmin(request, id);
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
