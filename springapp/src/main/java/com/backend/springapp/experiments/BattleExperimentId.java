package com.backend.springapp.experiments;

import java.io.Serializable;
import java.util.Objects;

public class BattleExperimentId implements Serializable {
    private Long battleId;
    private String experimentKey;

    public BattleExperimentId() {
    }

    public BattleExperimentId(Long battleId, String experimentKey) {
        this.battleId = battleId;
        this.experimentKey = experimentKey;
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof BattleExperimentId x
                && Objects.equals(battleId, x.battleId) && Objects.equals(experimentKey, x.experimentKey);
    }

    @Override
    public int hashCode() {
        return Objects.hash(battleId, experimentKey);
    }
}
