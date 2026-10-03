package com.backend.springapp.user;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.backend.springapp.common.JwtUtil;
import com.backend.springapp.gamification.leaderboard.InstitutionRepository;
import com.backend.springapp.user.dto.LoginRequestDTO;

class UserServiceLoginTest {

    private final String hash = new BCryptPasswordEncoder().encode("correct-horse");
    private final UserService service;

    UserServiceLoginTest() {
        UserRepository users = mock(UserRepository.class);
        User u = new User();
        u.setEmail("a@b.c");
        u.setUsername("a");
        u.setPassword(hash);
        when(users.findByEmail("a@b.c")).thenReturn(Optional.of(u));
        when(users.save(org.mockito.ArgumentMatchers.any(User.class))).thenAnswer(i -> i.getArgument(0));
        service = new UserService(users, mock(InstitutionRepository.class),
                mock(UserProgressRepository.class), new JwtUtil("x".repeat(40), 60000L));
    }

    private LoginRequestDTO req(String pw) {
        LoginRequestDTO d = new LoginRequestDTO();
        d.setEmail("a@b.c");
        d.setPassword(pw);
        return d;
    }

    @Test
    void storedHashIsNotAPassword() {
        assertThrows(IllegalArgumentException.class, () -> service.login(req(hash)));
    }

    @Test
    void wrongPasswordRejected() {
        assertThrows(IllegalArgumentException.class, () -> service.login(req("nope")));
    }

    @Test
    void correctPasswordWorks() {
        assertNotNull(service.login(req("correct-horse")));
    }
}
