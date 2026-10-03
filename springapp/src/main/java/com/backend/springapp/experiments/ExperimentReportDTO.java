package com.backend.springapp.experiments;

import java.util.List;

public record ExperimentReportDTO(String experimentKey, boolean enabled, List<VariantStatsDTO> variants) {
}
