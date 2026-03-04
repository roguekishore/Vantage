package com.backend.springapp.gamification.battle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BattleProblemRepository extends JpaRepository<BattleProblem, Long> {

    List<BattleProblem> findByBattleIdOrderByProblemIndex(Long battleId);
}
