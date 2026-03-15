package com.backend.springapp.friend.presence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "user_presence")
public class UserPresence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private LocalDateTime lastActiveAt;

    @PrePersist
    @PreUpdate
    public void onWrite() {
        if (lastActiveAt == null) {
            lastActiveAt = LocalDateTime.now();
        }
    }
}
