package com.meteoproject.service.ai;

import com.meteoproject.config.MeteoProperties;
import com.meteoproject.domain.meteo.MeteoHistory;
import com.meteoproject.repository.MeteoHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Layer 1: Trend Analysis (weight: 30%)
 * Uses Weighted Moving Average + Linear Regression on historical meteo scores
 * to project future trajectory.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TrendAnalyzer {

    private final MeteoHistoryRepository meteoHistoryRepository;
    private final MeteoProperties meteoProperties;

    public LayerResult analyze(UUID projectId, int horizonDays) {
        int maxPoints = meteoProperties.getAi().getMaxHistoryPoints();
        int minPoints = meteoProperties.getAi().getMinHistoryPoints();

        List<MeteoHistory> history = meteoHistoryRepository
                .findByProjectIdOrderByCalculationDateDesc(projectId, PageRequest.of(0, maxPoints))
                .getContent();

        if (history.size() < minPoints) {
            return LayerResult.builder()
                    .layerName("Trend")
                    .score(history.isEmpty() ? 50.0 : history.get(0).getCalculatedScore().doubleValue())
                    .confidence(0.3)
                    .explanation("Insufficient history for trend analysis (" + history.size() + " data points)")
                    .build();
        }

        double[] scores = new double[history.size()];
        for (int i = 0; i < history.size(); i++) {
            scores[history.size() - 1 - i] = history.get(i).getCalculatedScore().doubleValue();
        }

        double wma = calculateWeightedMovingAverage(scores);
        double[] regression = linearRegression(scores);
        double slope = regression[0];
        double intercept = regression[1];

        double projectedScore = intercept + slope * (scores.length + horizonDays / 7.0);
        projectedScore = Math.max(0, Math.min(100, projectedScore));

        double blendedScore = 0.6 * projectedScore + 0.4 * wma;
        blendedScore = Math.max(0, Math.min(100, blendedScore));

        double confidence = calculateTrendConfidence(scores, slope);

        String direction = slope > 0.5 ? "upward" : slope < -0.5 ? "downward" : "stable";
        String explanation = String.format(
                "Trend is %s (slope: %.2f/period). WMA: %.1f, projected: %.1f over %d days based on %d data points.",
                direction, slope, wma, projectedScore, horizonDays, scores.length);

        return LayerResult.builder()
                .layerName("Trend")
                .score(blendedScore)
                .confidence(confidence)
                .explanation(explanation)
                .build();
    }

    private double calculateWeightedMovingAverage(double[] values) {
        double weightedSum = 0;
        double totalWeight = 0;
        for (int i = 0; i < values.length; i++) {
            double weight = i + 1;
            weightedSum += values[i] * weight;
            totalWeight += weight;
        }
        return weightedSum / totalWeight;
    }

    private double[] linearRegression(double[] y) {
        int n = y.length;
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++) {
            sumX += i;
            sumY += y[i];
            sumXY += i * y[i];
            sumX2 += i * i;
        }
        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        double intercept = (sumY - slope * sumX) / n;

        if (Double.isNaN(slope) || Double.isInfinite(slope)) {
            slope = 0;
            intercept = sumY / n;
        }

        return new double[]{slope, intercept};
    }

    private double calculateTrendConfidence(double[] scores, double slope) {
        if (scores.length < 3) return 0.3;

        double mean = 0;
        for (double s : scores) mean += s;
        mean /= scores.length;

        double variance = 0;
        for (double s : scores) variance += (s - mean) * (s - mean);
        variance /= scores.length;
        double stdDev = Math.sqrt(variance);

        double stabilityFactor = Math.max(0, 1 - stdDev / 30.0);
        double dataFactor = Math.min(1.0, scores.length / 10.0);
        double consistencyFactor = Math.abs(slope) < 10 ? 0.8 : 0.5;

        return Math.min(0.95, stabilityFactor * 0.4 + dataFactor * 0.4 + consistencyFactor * 0.2);
    }
}
