package com.meteoproject.service.ai;

import com.meteoproject.domain.plan.Action;
import com.meteoproject.domain.plan.enums.ActionStatus;
import com.meteoproject.domain.user.UserProjectRole;
import com.meteoproject.repository.ActionRepository;
import com.meteoproject.repository.UserProjectRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Layer 5: Capacity Analysis (weight: 10%)
 * Evaluates team workload distribution and resource availability.
 * Checks for overloaded team members and unassigned critical tasks.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CapacityAnalyzer {

    private final ActionRepository actionRepository;
    private final UserProjectRoleRepository userProjectRoleRepository;

    public LayerResult analyze(UUID projectId) {
        List<Action> actions = actionRepository.findByProjectIdOrderByOrderIndexAsc(projectId);
        List<UserProjectRole> teamMembers = userProjectRoleRepository.findByProjectIdActive(projectId);

        if (actions.isEmpty() || teamMembers.isEmpty()) {
            return LayerResult.builder()
                    .layerName("Capacity")
                    .score(50.0)
                    .confidence(0.2)
                    .explanation("Insufficient data for capacity analysis")
                    .build();
        }

        List<Action> activeActions = actions.stream()
                .filter(a -> a.getStatus() == ActionStatus.IN_PROGRESS || a.getStatus() == ActionStatus.NOT_STARTED)
                .toList();

        int teamSize = teamMembers.size();
        int totalActive = activeActions.size();

        Map<UUID, Long> workloadByUser = activeActions.stream()
                .filter(a -> a.getResponsible() != null)
                .collect(Collectors.groupingBy(a -> a.getResponsible().getId(), Collectors.counting()));

        long unassigned = activeActions.stream()
                .filter(a -> a.getResponsible() == null)
                .count();

        double avgWorkload = teamSize > 0 ? (double) totalActive / teamSize : 0;
        long overloaded = workloadByUser.values().stream()
                .filter(count -> count > avgWorkload * 1.5)
                .count();

        double unassignedRatio = totalActive > 0 ? (double) unassigned / totalActive : 0;
        double overloadRatio = teamSize > 0 ? (double) overloaded / teamSize : 0;

        double workloadBalance = 1.0;
        if (!workloadByUser.isEmpty()) {
            double maxLoad = workloadByUser.values().stream().mapToLong(Long::longValue).max().orElse(0);
            double minLoad = workloadByUser.values().stream().mapToLong(Long::longValue).min().orElse(0);
            workloadBalance = maxLoad > 0 ? 1 - (maxLoad - minLoad) / maxLoad : 1.0;
        }

        double score = 100
                - unassignedRatio * 30
                - overloadRatio * 30
                - (1 - workloadBalance) * 20;

        if (avgWorkload > 5) score -= 10;
        if (avgWorkload > 8) score -= 10;

        score = Math.max(0, Math.min(100, score));

        double confidence = Math.min(0.8, 0.3 + teamSize * 0.05 + totalActive * 0.02);

        String explanation = String.format(
                "Team: %d members, %d active tasks (avg %.1f/person). " +
                "Unassigned: %d, overloaded members: %d. Balance: %.0f%%.",
                teamSize, totalActive, avgWorkload, unassigned, overloaded, workloadBalance * 100);

        return LayerResult.builder()
                .layerName("Capacity")
                .score(score)
                .confidence(confidence)
                .explanation(explanation)
                .build();
    }
}
