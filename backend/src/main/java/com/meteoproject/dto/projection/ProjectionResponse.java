package com.meteoproject.dto.projection;

import com.meteoproject.domain.meteo.enums.MeteoState;
import com.meteoproject.domain.projection.enums.ConfidenceLevel;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ProjectionResponse {
    private UUID id;
    private UUID projectId;
    private int horizonDays;
    private Instant calculatedAt;

    private ScenarioResult nominalScenario;
    private ScenarioResult optimisticScenario;
    private ScenarioResult pessimisticScenario;

    private double confidence;
    private ConfidenceLevel confidenceLevel;

    private LayerBreakdown layerBreakdown;
    private List<String> explanations;
    private List<RecommendationItem> recommendations;

    @Data
    @Builder
    public static class ScenarioResult {
        private String name;
        private double probability;
        private MeteoState projectedState;
        private int projectedScore;
        private double projectedProgress;
        private String completionDate;
        private double budgetAtCompletion;
    }

    @Data
    @Builder
    public static class LayerBreakdown {
        private LayerResult trend;
        private LayerResult simulation;
        private LayerResult actionPlan;
        private LayerResult risk;
        private LayerResult capacity;
        private double compositeScore;
    }

    @Data
    @Builder
    public static class LayerResult {
        private String layerName;
        private double weight;
        private double score;
        private double confidence;
        private String explanation;
    }

    @Data
    @Builder
    public static class RecommendationItem {
        private String category;
        private String priority;
        private String action;
        private String expectedImpact;
    }
}
