package com.backend.springapp.experiments;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/** One row per (battle, experiment): which variant the battle got. Written once at battle creation. */
@Entity
@Table(name = "battle_experiments")
@IdClass(BattleExperimentId.class)
public class BattleExperiment {

    @Id
    @Column(name = "battle_id", nullable = false)
    private Long battleId;

    @Id
    @Column(name = "experiment_key", length = 64, nullable = false)
    private String experimentKey;

    @Column(name = "variant", length = 16, nullable = false)
    private String variant;

    @Column(name = "assigned_at", nullable = false, columnDefinition = "DATETIME(3) NOT NULL")
    private LocalDateTime assignedAt;

    protected BattleExperiment() {
    }

    public BattleExperiment(Long battleId, String experimentKey, String variant, LocalDateTime assignedAt) {
        this.battleId = battleId;
        this.experimentKey = experimentKey;
        this.variant = variant;
        this.assignedAt = assignedAt;
    }

    public Long getBattleId() { return battleId; }
    public String getExperimentKey() { return experimentKey; }
    public String getVariant() { return variant; }
    public LocalDateTime getAssignedAt() { return assignedAt; }
}
