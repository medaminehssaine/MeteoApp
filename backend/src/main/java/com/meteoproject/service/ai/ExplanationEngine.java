package com.meteoproject.service.ai;

import com.meteoproject.domain.meteo.enums.MeteoState;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Generates human-readable explanations for AI projections.
 */
@Component
public class ExplanationEngine {

    public List<String> generate(LayerResult trend, LayerResult simulation,
                                  LayerResult actionPlan, LayerResult risk,
                                  LayerResult capacity, double compositeScore,
                                  MeteoState projectedState, int horizonDays) {
        List<String> explanations = new ArrayList<>();

        explanations.add(String.format(
                "Projection over %d days: composite score %.1f → %s",
                horizonDays, compositeScore, projectedState.name()));

        if (trend.getScore() < 50) {
            explanations.add("WARNING: Trend analysis indicates declining project health. " + trend.getExplanation());
        } else if (trend.getScore() >= 80) {
            explanations.add("Positive trend: project health is improving steadily.");
        }

        if (simulation.getScore() < 50) {
            explanations.add("RISK: Monte Carlo simulations suggest plan completion is at risk. " + simulation.getExplanation());
        }

        if (actionPlan.getScore() < 60) {
            explanations.add("ATTENTION: Action plan shows signs of stress — review late and blocked actions. " + actionPlan.getExplanation());
        }

        if (risk.getScore() < 50) {
            explanations.add("HIGH RISK: Significant unmitigated risks threaten project health. " + risk.getExplanation());
        }

        if (capacity.getScore() < 50) {
            explanations.add("CAPACITY CONCERN: Team workload imbalance detected. " + capacity.getExplanation());
        }

        LayerResult weakest = findWeakest(trend, simulation, actionPlan, risk, capacity);
        explanations.add(String.format(
                "Primary concern: %s layer (score: %.1f). Focus corrective actions here.",
                weakest.getLayerName(), weakest.getScore()));

        return explanations;
    }

    private LayerResult findWeakest(LayerResult... layers) {
        LayerResult weakest = layers[0];
        for (LayerResult l : layers) {
            if (l.getScore() < weakest.getScore()) weakest = l;
        }
        return weakest;
    }
}
