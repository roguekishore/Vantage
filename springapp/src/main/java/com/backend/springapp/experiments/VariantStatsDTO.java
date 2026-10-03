package com.backend.springapp.experiments;

public record VariantStatsDTO(String variant, long battles, long completed, long cancelled, long forfeited,
                              double meanDurationSeconds, double meanProblemsSolvedPerPlayer) {
}
