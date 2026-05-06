package com.meteoproject.service.ai;

import com.meteoproject.domain.risk.Risk;
import com.meteoproject.domain.risk.enums.RiskStatus;
import com.meteoproject.repository.CorrectiveActionRepository;
import com.meteoproject.repository.RiskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Layer 4: Risk Integration (weight: 15%)
 * Evaluates risk exposure and mitigation coverage.
 * High severity unmitigated risks lower the score.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RiskIntegrator {

    private final RiskRepository riskRepository;
    private final CorrectiveActionRepository correctiveActionRepository;

    public LayerResult evaluate(UUID projectId) {
        List<Risk> risks = riskRepository.findByProjectId(projectId);

        if (risks.isEmpty()) {
            return LayerResult.builder()
                    .layerName("Risk")
                    .score(80.0)
                    .confidence(0.5)
                    .explanation("No risks identified — defaulting to moderate score")
                    .build();
        }

        int totalRisks = risks.size();
        int activeRisks = 0;
        int resolvedRisks = 0;
        double totalSeverity = 0;
        double unmitigatedSeverity = 0;
        int highSeverityUnmitigated = 0;

        for (Risk risk : risks) {
            if (risk.getStatus() == RiskStatus.CLOSED) {
                resolvedRisks++;
                continue;
            }

            activeRisks++;
            int severity = risk.getSeverity() != null ? risk.getSeverity() : risk.getProbability() * risk.getImpact();
            totalSeverity += severity;

            if (risk.getMitigationPlan() == null || risk.getMitigationPlan().isBlank()) {
                unmitigatedSeverity += severity;
                if (severity >= 15) {
                    highSeverityUnmitigated++;
                }
            }
        }

        double maxPossibleSeverity = activeRisks * 25.0;
        double severityRatio = maxPossibleSeverity > 0 ? totalSeverity / maxPossibleSeverity : 0;
        double mitigationCoverage = totalSeverity > 0 ? 1 - (unmitigatedSeverity / totalSeverity) : 1;

        double score = 100
                - severityRatio * 40
                - (1 - mitigationCoverage) * 30
                - highSeverityUnmitigated * 10;
        score = Math.max(0, Math.min(100, score));

        double confidence = Math.min(0.85, 0.4 + activeRisks * 0.05);

        String explanation = String.format(
                "Risk exposure: %d active risks (avg severity: %.1f/25). " +
                "Mitigation coverage: %.0f%%. High-severity unmitigated: %d.",
                activeRisks, activeRisks > 0 ? totalSeverity / activeRisks : 0,
                mitigationCoverage * 100, highSeverityUnmitigated);

        return LayerResult.builder()
                .layerName("Risk")
                .score(score)
                .confidence(confidence)
                .explanation(explanation)
                .build();
    }
}
