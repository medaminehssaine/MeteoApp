package com.meteoproject.service.ai;

import com.meteoproject.config.MeteoProperties;
import com.meteoproject.domain.plan.Action;
import com.meteoproject.domain.plan.enums.ActionStatus;
import com.meteoproject.repository.ActionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Random;
import java.util.UUID;

/**
 * Layer 2: Plan Simulation (weight: 25%)
 * Monte Carlo simulation of project plan execution.
 * Simulates action completion based on current velocity and variability.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PlanSimulator {

    private final ActionRepository actionRepository;
    private final MeteoProperties meteoProperties;

    public LayerResult simulate(UUID projectId, int horizonDays) {
        List<Action> actions = actionRepository.findByProjectIdOrderByOrderIndexAsc(projectId);

        if (actions.isEmpty()) {
            return LayerResult.builder()
                    .layerName("Simulation")
                    .score(50.0)
                    .confidence(0.2)
                    .explanation("No actions found for Monte Carlo simulation")
                    .build();
        }

        int iterations = meteoProperties.getAi().getMonteCarloIterations();
        double[] simulatedScores = new double[iterations];
        Random random = new Random(42);

        double currentVelocity = calculateVelocity(actions);
        double velocityVariance = calculateVelocityVariance(actions, currentVelocity);
        LocalDate targetDate = LocalDate.now().plusDays(horizonDays);

        for (int i = 0; i < iterations; i++) {
            simulatedScores[i] = runSimulation(actions, targetDate, currentVelocity, velocityVariance, random);
        }

        double meanScore = 0;
        for (double s : simulatedScores) meanScore += s;
        meanScore /= iterations;

        double p10 = percentile(simulatedScores, 10);
        double p50 = percentile(simulatedScores, 50);
        double p90 = percentile(simulatedScores, 90);

        double spread = p90 - p10;
        double confidence = Math.max(0.2, Math.min(0.9, 1.0 - spread / 100.0));

        String explanation = String.format(
                "Monte Carlo simulation (%d iterations): mean=%.1f, P10=%.1f, P50=%.1f, P90=%.1f. " +
                "Current velocity: %.2f%%/day. Spread: %.1f.",
                iterations, meanScore, p10, p50, p90, currentVelocity, spread);

        return LayerResult.builder()
                .layerName("Simulation")
                .score(p50)
                .confidence(confidence)
                .explanation(explanation)
                .build();
    }

    public double[] getScenarioScores(UUID projectId, int horizonDays) {
        List<Action> actions = actionRepository.findByProjectIdOrderByOrderIndexAsc(projectId);
        if (actions.isEmpty()) return new double[]{50, 50, 50};

        int iterations = meteoProperties.getAi().getMonteCarloIterations();
        double[] simulatedScores = new double[iterations];
        Random random = new Random(42);
        double velocity = calculateVelocity(actions);
        double variance = calculateVelocityVariance(actions, velocity);
        LocalDate target = LocalDate.now().plusDays(horizonDays);

        for (int i = 0; i < iterations; i++) {
            simulatedScores[i] = runSimulation(actions, target, velocity, variance, random);
        }

        return new double[]{
                percentile(simulatedScores, 50),
                percentile(simulatedScores, 80),
                percentile(simulatedScores, 20)
        };
    }

    private double runSimulation(List<Action> actions, LocalDate targetDate,
                                  double velocity, double variance, Random random) {
        double totalWeight = 0;
        double completedWeight = 0;

        for (Action action : actions) {
            double actionWeight = action.getDurationDays() != null ? action.getDurationDays() : 1.0;
            totalWeight += actionWeight;

            if (action.getStatus() == ActionStatus.COMPLETED) {
                completedWeight += actionWeight;
                continue;
            }
            double currentProgress = action.getProgress() != null ? action.getProgress() : 0;
            double remaining = 100.0 - currentProgress;

            long daysToTarget = ChronoUnit.DAYS.between(LocalDate.now(), targetDate);
            double simulatedVelocity = velocity + random.nextGaussian() * variance;
            simulatedVelocity = Math.max(0.1, simulatedVelocity);

            double projectedProgress = currentProgress + simulatedVelocity * daysToTarget;

            if (action.getStatus() == ActionStatus.BLOCKED) {
                double unblockProbability = 0.3 + random.nextDouble() * 0.4;
                projectedProgress *= unblockProbability;
            }

            projectedProgress = Math.min(100, projectedProgress);
            completedWeight += actionWeight * (projectedProgress / 100.0);
        }

        return totalWeight > 0 ? (completedWeight / totalWeight) * 100.0 : 50.0;
    }

    private double calculateVelocity(List<Action> actions) {
        double totalProgress = 0;
        double totalDays = 0;
        int count = 0;

        for (Action action : actions) {
            if (action.getStatus() == ActionStatus.IN_PROGRESS || action.getStatus() == ActionStatus.COMPLETED) {
                double progress = action.getProgress() != null ? action.getProgress() : 0;
                LocalDate startDate = action.getActualStart() != null ? action.getActualStart() : action.getPlannedStart();
                long days = ChronoUnit.DAYS.between(startDate, LocalDate.now());
                if (days > 0) {
                    totalProgress += progress;
                    totalDays += days;
                    count++;
                }
            }
        }

        return count > 0 && totalDays > 0 ? totalProgress / totalDays : 1.0;
    }

    private double calculateVelocityVariance(List<Action> actions, double meanVelocity) {
        double sumSquaredDiff = 0;
        int count = 0;

        for (Action action : actions) {
            if (action.getStatus() == ActionStatus.IN_PROGRESS || action.getStatus() == ActionStatus.COMPLETED) {
                double progress = action.getProgress() != null ? action.getProgress() : 0;
                LocalDate startDate = action.getActualStart() != null ? action.getActualStart() : action.getPlannedStart();
                long days = ChronoUnit.DAYS.between(startDate, LocalDate.now());
                if (days > 0) {
                    double velocity = progress / days;
                    sumSquaredDiff += (velocity - meanVelocity) * (velocity - meanVelocity);
                    count++;
                }
            }
        }

        return count > 1 ? Math.sqrt(sumSquaredDiff / (count - 1)) : meanVelocity * 0.3;
    }

    private double percentile(double[] data, int p) {
        double[] sorted = data.clone();
        java.util.Arrays.sort(sorted);
        int index = (int) Math.ceil(p / 100.0 * sorted.length) - 1;
        return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
    }
}
