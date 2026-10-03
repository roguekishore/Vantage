package com.backend.springapp.experiments;

import com.backend.springapp.gamification.battle.BattleMode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * The single experiment: does a 1v1 end when the first player solves every problem. Assignment happens once at
 * battle creation; the first-finisher rule reads the stored variant. Disabled means no rows and all control.
 */
@Service
public class ExperimentService {

    private static final String KEY = ExperimentHasher.FIRST_FINISHER_ENDS;

    private final BattleExperimentRepository repo;
    private final JdbcTemplate jdbc;
    @Value("${vantage.experiments.enabled:false}")
    private boolean enabled = false;
    @Value("${vantage.experiments.first-finisher-ends.allocation-bps:5000}")
    private int allocationBps = 5000;

    public ExperimentService(BattleExperimentRepository repo, JdbcTemplate jdbc) {
        this.repo = repo;
        this.jdbc = jdbc;
    }

    public boolean isEnabled() {
        return enabled;
    }

    /** Assigns and stores the variant for a new 1v1 battle. No-op (returns control) when disabled or not 1v1. */
    public String assignOnCreate(Long battleId, BattleMode mode) {
        if (!enabled || mode == BattleMode.GROUP_FFA) {
            return ExperimentHasher.CONTROL;
        }
        String variant = ExperimentHasher.variant(KEY, battleId, allocationBps);
        repo.save(new BattleExperiment(battleId, KEY, variant, LocalDateTime.now()));
        return variant;
    }

    /** True when this battle is in the treatment arm (the first finisher ends it). Always false when disabled. */
    public boolean isTreatment(Long battleId) {
        if (!enabled) {
            return false;
        }
        return repo.findById(new BattleExperimentId(battleId, KEY))
                .map(e -> ExperimentHasher.TREATMENT.equals(e.getVariant())).orElse(false);
    }

    public ExperimentReportDTO report() {
        List<VariantStatsDTO> out = new ArrayList<>();
        for (String variant : List.of(ExperimentHasher.CONTROL, ExperimentHasher.TREATMENT)) {
            long[] c = jdbc.queryForObject(
                    "SELECT COUNT(*), COALESCE(SUM(b.state='COMPLETED'),0), COALESCE(SUM(b.state='CANCELLED'),0), "
                            + "COALESCE(SUM(b.ended_reason='FORFEIT'),0), "
                            + "COALESCE(AVG(CASE WHEN b.state='COMPLETED' AND b.started_at IS NOT NULL "
                            + "AND b.completed_at IS NOT NULL "
                            + "THEN TIMESTAMPDIFF(MICROSECOND, b.started_at, b.completed_at)/1000000.0 END),0)*1000 "
                            + "FROM battle_experiments e JOIN battles b ON b.id = e.battle_id "
                            + "WHERE e.experiment_key = ? AND e.variant = ?",
                    (rs, i) -> new long[]{rs.getLong(1), rs.getLong(2), rs.getLong(3), rs.getLong(4),
                            Math.round(rs.getDouble(5))},
                    KEY, variant);
            Double solved = jdbc.queryForObject(
                    "SELECT COALESCE(AVG(p.problems_solved),0) FROM battle_experiments e "
                            + "JOIN battle_participants p ON p.battle_id = e.battle_id "
                            + "WHERE e.experiment_key = ? AND e.variant = ?", Double.class, KEY, variant);
            out.add(new VariantStatsDTO(variant, c[0], c[1], c[2], c[3], c[4] / 1000.0,
                    solved == null ? 0.0 : solved));
        }
        return new ExperimentReportDTO(KEY, enabled, out);
    }
}
