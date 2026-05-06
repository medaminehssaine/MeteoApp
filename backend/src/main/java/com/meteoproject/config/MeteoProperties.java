package com.meteoproject.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import java.util.Map;

@Data
@Component
@ConfigurationProperties(prefix = "meteo")
public class MeteoProperties {

    private Thresholds thresholds = new Thresholds();
    private Forcing forcing = new Forcing();
    private Map<String, Double> criticalityCoefficients = Map.of(
        "LOW", 0.5, "MEDIUM", 1.0, "HIGH", 1.5, "CRITICAL", 2.0
    );
    private Cqd cqd = new Cqd();
    private Ai ai = new Ai();

    @Data
    public static class Thresholds {
        private int soleil = 85;
        private int nuageClair = 70;
        private int nuageCharge = 50;
    }

    @Data
    public static class Forcing {
        private int blockedActionDays = 5;
        private int lateActionsPct = 30;
        private int budgetOverrunPct = 120;
        private int noUpdateDays = 10;
    }

    @Data
    public static class Cqd {
        private double costAlignedMax = 5;
        private double costTensionMax = 15;
        private double qualityAlignedMin = 70;
        private double qualityTensionMin = 50;
        private double delayAlignedMin = -5;
        private double delayTensionMin = -15;
    }

    @Data
    public static class Ai {
        private Weights weights = new Weights();
        private int monteCarloIterations = 100;
        private int maxHistoryPoints = 10;
        private int minHistoryPoints = 3;
        private Confidence confidence = new Confidence();
    }

    @Data
    public static class Weights {
        private double trend = 0.30;
        private double simulation = 0.25;
        private double actionPlan = 0.20;
        private double risk = 0.15;
        private double capacity = 0.10;
    }

    @Data
    public static class Confidence {
        private int highThreshold = 70;
        private int mediumThreshold = 45;
    }

    public double getCriticalityCoefficient(String criticality) {
        return criticalityCoefficients.getOrDefault(criticality, 1.0);
    }
}
