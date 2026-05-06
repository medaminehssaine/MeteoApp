package com.meteoproject.service.ai;

import com.meteoproject.domain.plan.Action;
import com.meteoproject.domain.plan.enums.ActionStatus;
import com.meteoproject.repository.ActionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Layer 3: Action Plan Evaluation (weight: 20%)
 * Evaluates the health and feasibility of the current action plan.
 * Checks: completion rate, on-time delivery, blocking ratio, dependency health.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ActionPlanEvaluator {

    private final ActionRepository actionRepository;

    public LayerResult evaluate(UUID projectId) {
        List<Action> actions = actionRepository.findByProjectIdOrderByOrderIndexAsc(projectId);

        if (actions.isEmpty()) {
            return LayerResult.builder()
                    .layerName("ActionPlan")
                    .score(50.0)
                    .confidence(0.2)
                    .explanation("No actions defined in project plan")
                    .build();
        }

        int total = actions.size();
        int completed = 0;
        int late = 0;
        int blocked = 0;
        int onTrack = 0;
        double totalWeightedProgress = 0;
        double totalWeight = 0;

        for (Action action : actions) {
            double weight = action.getDurationDays() != null ? action.getDurationDays() : 1.0;
            double progress = action.getProgress() != null ? action.getProgress() : 0;
            totalWeight += weight;
            totalWeightedProgress += weight * progress;

            switch (action.getStatus()) {
                case COMPLETED -> completed++;
                case BLOCKED -> blocked++;
                default -> {
                    if (action.getPlannedEnd() != null && LocalDate.now().isAfter(action.getPlannedEnd())) {
                        late++;
                    } else {
                        double expectedProgress = calculateExpectedProgress(action);
                        if (progress >= expectedProgress * 0.8) {
                            onTrack++;
                        } else {
                            late++;
                        }
                    }
                }
            }
        }

        double completionScore = totalWeight > 0 ? (totalWeightedProgress / totalWeight) : 0;
        double lateRatio = total > 0 ? (double) late / total : 0;
        double blockedRatio = total > 0 ? (double) blocked / total : 0;
        double onTrackRatio = total > 0 ? (double) (onTrack + completed) / total : 0;

        double score = completionScore * 0.3
                + (1 - lateRatio) * 100 * 0.3
                + (1 - blockedRatio) * 100 * 0.2
                + onTrackRatio * 100 * 0.2;
        score = Math.max(0, Math.min(100, score));

        double confidence = Math.min(0.9, 0.5 + total * 0.03);

        String explanation = String.format(
                "Plan health: %d/%d completed, %d late, %d blocked. " +
                "Weighted progress: %.1f%%. On-track ratio: %.0f%%.",
                completed, total, late, blocked, completionScore, onTrackRatio * 100);

        return LayerResult.builder()
                .layerName("ActionPlan")
                .score(score)
                .confidence(confidence)
                .explanation(explanation)
                .build();
    }

    private double calculateExpectedProgress(Action action) {
        LocalDate startDate = action.getActualStart() != null ? action.getActualStart() : action.getPlannedStart();
        if (startDate == null || action.getPlannedEnd() == null) return 50;
        long totalDays = ChronoUnit.DAYS.between(startDate, action.getPlannedEnd());
        long elapsedDays = ChronoUnit.DAYS.between(startDate, LocalDate.now());
        if (totalDays <= 0) return 100;
        return Math.min(100, (double) elapsedDays / totalDays * 100);
    }
}
