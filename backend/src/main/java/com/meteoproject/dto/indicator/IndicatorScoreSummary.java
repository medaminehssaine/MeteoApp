package com.meteoproject.dto.indicator;

import com.meteoproject.domain.indicator.enums.IndicatorCategory;
import lombok.Builder;
import lombok.Data;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class IndicatorScoreSummary {
    private UUID projectId;
    private double globalScore;
    private Map<IndicatorCategory, Double> categoryScores;
    private int indicatorCount;
    private int criticalCount;
}
