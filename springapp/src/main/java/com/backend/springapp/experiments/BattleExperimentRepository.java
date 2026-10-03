package com.backend.springapp.experiments;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BattleExperimentRepository extends JpaRepository<BattleExperiment, BattleExperimentId> {
}
