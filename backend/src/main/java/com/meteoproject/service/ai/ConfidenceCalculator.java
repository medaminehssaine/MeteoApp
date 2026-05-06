package com.meteoproject.service.ai;

import com.meteoproject.config.MeteoProperties;
import com.meteoproject.domain.projection.enums.ConfidenceLevel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Calculates overall projection confidence based on:
 * - Individual layer confidences (weighted)
 * - Inter-layer coherence
 * - Horizon decay factor
 * - Data availability factor
 */
@Component
@RequiredArgsConstructor
public class ConfidenceCalculator {

    private final MeteoProperties meteoProperties;

    public double calculate(LayerResult trend, LayerResult simulation,
                            LayerResult actionPlan, LayerResult risk,
                            LayerResult capacity, int horizonDays) {
        MeteoProperties.Weights weights = meteoProperties.getAi().getWeights();

        double weightedConfidence =
                trend.getConfidence() * weights.getTrend()
                + simulation.getConfidence() * weights.getSimulation()
                + actionPlan.getConfidence() * weights.getActionPlan()
                + risk.getConfidence() * weights.getRisk()
                + capacity.getConfidence() * weights.getCapacity();

        double coherence = calculateCoherence(trend, simulation, actionPlan, risk, capacity);

        double horizonFactor = Math.max(0.3, 1.0 - (horizonDays - 7) / 365.0);

        double finalConfidence = weightedConfidence * 0.5
                + coherence * 0.3
                + horizonFactor * 0.2;

        return Math.max(0.05, Math.min(0.95, finalConfidence));
    }

    public ConfidenceLevel toLevel(double confidence) {
        int pct = (int) (confidence * 100);
        if (pct >= meteoProperties.getAi().getConfidence().getHighThreshold()) {
            return ConfidenceLevel.HIGH;
        } else if (pct >= meteoProperties.getAi().getConfidence().getMediumThreshold()) {
            return ConfidenceLevel.MEDIUM;
        } else {
            return ConfidenceLevel.LOW;
        }
    }

    private double calculateCoherence(LayerResult... layers) {
        double[] scores = new double[layers.length];
        for (int i = 0; i < layers.length; i++) {
            scores[i] = layers[i].getScore();
        }

        double mean = 0;
        for (double s : scores) mean += s;
        mean /= scores.length;

        double variance = 0;
        for (double s : scores) variance += (s - mean) * (s - mean);
        variance /= scores.length;

        double maxDeviation = 50.0;
        double stdDev = Math.sqrt(variance);
        return Math.max(0, 1 - stdDev / maxDeviation);
    }
}
