package com.backend.springapp.gamification.leaderboard;

import jakarta.persistence.*;
import lombok.*;

/**
 * Represents an educational institution (university, bootcamp, etc.).
 * Users can optionally belong to one institution for institution-scoped leaderboards.
 */
@Entity
@Table(name = "institution")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Institution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;
}
