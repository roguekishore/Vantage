package com.backend.springapp.gamification.leaderboard;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstitutionRepository extends JpaRepository<Institution, Long> {
    Optional<Institution> findByName(String name);

    @Query("SELECT i FROM Institution i WHERE LOWER(i.name) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY i.name")
    List<Institution> searchByName(@Param("q") String q, Pageable pageable);
}
