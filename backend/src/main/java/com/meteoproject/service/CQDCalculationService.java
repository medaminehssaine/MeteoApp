package com.meteoproject.service;

import com.meteoproject.config.MeteoProperties;
import com.meteoproject.domain.cqd.CQDHistory;
import com.meteoproject.domain.cqd.enums.CQDState;
import com.meteoproject.domain.cqd.enums.Trend;
import com.meteoproject.domain.indicator.ProjectIndicator;
import com.meteoproject.domain.project.Project;
import com.meteoproject.dto.cqd.CQDHistoryResponse;
import com.meteoproject.dto.cqd.CQDResponse;
import com.meteoproject.exception.ResourceNotFoundException;
import com.meteoproject.repository.ActionRepository;
import com.meteoproject.repository.CQDHistoryRepository;
import com.meteoproject.repository.ProjectIndicatorRepository;
import com.meteoproject.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CQDCalculationService {

    private final CQDHistoryRepository cqdHistoryRepository;
    private final ProjectRepository projectRepository;
    private final ProjectIndicatorRepository projectIndicatorRepository;
    private final ActionRepository actionRepository;
    private final MeteoProperties meteoProperties;

    // ── Public API ──────────────────────────────────────────────────────

    @Transactional
    public CQDResponse calculateCQD(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        // Cost calculation
        BigDecimal costVariancePct = calculateCostVariance(project);
        CQDState costState = determineCostState(costVariancePct);

        // Quality calculation
        int qualityScore = calculateQualityScore(projectId);
        CQDState qualityState = determineQualityState(qualityScore);

        // Delay calculation
        BigDecimal delayVariancePct = calculateDelayVariance(project, projectId);
        CQDState delayState = determineDelayState(delayVariancePct);

        // Overall state = worst of the three
        CQDState overallState = worstState(costState, qualityState, delayState);

        // Get previous for trends
        List<CQDHistory> previousEntries = cqdHistoryRepository.findLatest(projectId, PageRequest.of(0, 1));
        Trend costTrend = Trend.STABLE;
        Trend qualityTrend = Trend.STABLE;
        Trend delayTrend = Trend.STABLE;

        if (!previousEntries.isEmpty()) {
            CQDHistory prev = previousEntries.get(0);
            costTrend = determineTrend(costVariancePct, prev.getCostVariancePct(), true);
            qualityTrend = determineTrend(BigDecimal.valueOf(qualityScore), BigDecimal.valueOf(prev.getQualityScore()), false);
            delayTrend = determineTrend(delayVariancePct, prev.getDelayVariancePct(), true);
        }

        // Calculate actual/planned progress for the record
        BigDecimal plannedProgress = calculatePlannedProgress(project);
        BigDecimal actualProgress = calculateActualProgress(projectId);

        // Save to CQDHistory
        CQDHistory history = CQDHistory.builder()
                .projectId(projectId)
                .calculationDate(LocalDate.now())
                .costState(costState)
                .costVariancePct(costVariancePct)
                .costBudgetConsumed(project.getBudgetConsumed())
                .costBudgetPlanned(project.getBudgetTotal())
                .costExplanation(buildCostExplanation(costVariancePct, project))
                .qualityState(qualityState)
                .qualityScore(qualityScore)
                .qualityExplanation(buildQualityExplanation(qualityScore, projectId))
                .delayState(delayState)
                .delayVariancePct(delayVariancePct)
                .delayPlannedProgress(plannedProgress)
                .delayActualProgress(actualProgress)
                .delayExplanation(buildDelayExplanation(delayVariancePct, plannedProgress, actualProgress))
                .costTrend(costTrend)
                .qualityTrend(qualityTrend)
                .delayTrend(delayTrend)
                .build();

        cqdHistoryRepository.save(history);

        return CQDResponse.builder()
                .projectId(projectId)
                .costState(costState)
                .qualityState(qualityState)
                .delayState(delayState)
                .costVariancePct(costVariancePct)
                .qualityScore(qualityScore)
                .delayVariancePct(delayVariancePct)
                .overallState(overallState)
                .calculatedAt(LocalDate.now())
                .costTrend(costTrend)
                .qualityTrend(qualityTrend)
                .delayTrend(delayTrend)
                .build();
    }

    @Transactional(readOnly = true)
    public CQDResponse getCurrentCQD(UUID projectId) {
        List<CQDHistory> latest = cqdHistoryRepository.findLatest(projectId, PageRequest.of(0, 2));

        if (latest.isEmpty()) {
            return CQDResponse.builder()
                    .projectId(projectId)
                    .costState(CQDState.ALIGNED)
                    .qualityState(CQDState.ALIGNED)
                    .delayState(CQDState.ALIGNED)
                    .costVariancePct(BigDecimal.ZERO)
                    .qualityScore(100)
                    .delayVariancePct(BigDecimal.ZERO)
                    .overallState(CQDState.ALIGNED)
                    .calculatedAt(LocalDate.now())
                    .costTrend(Trend.STABLE)
                    .qualityTrend(Trend.STABLE)
                    .delayTrend(Trend.STABLE)
                    .build();
        }

        CQDHistory current = latest.get(0);
        CQDState overallState = worstState(current.getCostState(), current.getQualityState(), current.getDelayState());

        return CQDResponse.builder()
                .projectId(projectId)
                .costState(current.getCostState())
                .qualityState(current.getQualityState())
                .delayState(current.getDelayState())
                .costVariancePct(current.getCostVariancePct())
                .qualityScore(current.getQualityScore())
                .delayVariancePct(current.getDelayVariancePct())
                .overallState(overallState)
                .calculatedAt(current.getCalculationDate())
                .costTrend(current.getCostTrend())
                .qualityTrend(current.getQualityTrend())
                .delayTrend(current.getDelayTrend())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<CQDHistoryResponse> getCQDHistory(UUID projectId, Pageable pageable) {
        List<CQDHistory> entries = cqdHistoryRepository.findLatest(projectId, pageable);

        List<CQDHistoryResponse> responses = entries.stream()
                .map(this::toHistoryResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, responses.size());
    }

    // ── Private: Cost Calculation ──────────────────────────────────────

    private BigDecimal calculateCostVariance(Project project) {
        BigDecimal budgetTotal = project.getBudgetTotal();
        BigDecimal budgetConsumed = project.getBudgetConsumed();

        if (budgetTotal == null || budgetTotal.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        // Compute planned budget at current point in time (linear interpolation)
        BigDecimal plannedAtNow = calculatePlannedBudgetAtNow(project);
        if (plannedAtNow.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        // Variance = (consumed - planned) / planned * 100
        return budgetConsumed.subtract(plannedAtNow)
                .divide(plannedAtNow, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculatePlannedBudgetAtNow(Project project) {
        LocalDate start = project.getStartDate();
        LocalDate end = project.getEndDate();
        LocalDate now = LocalDate.now();

        if (now.isAfter(end)) {
            return project.getBudgetTotal();
        }
        if (now.isBefore(start)) {
            return BigDecimal.ZERO;
        }

        long totalDays = ChronoUnit.DAYS.between(start, end);
        if (totalDays <= 0) {
            return project.getBudgetTotal();
        }

        long elapsedDays = ChronoUnit.DAYS.between(start, now);
        BigDecimal ratio = BigDecimal.valueOf(elapsedDays)
                .divide(BigDecimal.valueOf(totalDays), 4, RoundingMode.HALF_UP);

        return project.getBudgetTotal().multiply(ratio).setScale(2, RoundingMode.HALF_UP);
    }

    private CQDState determineCostState(BigDecimal variancePct) {
        MeteoProperties.Cqd cqd = meteoProperties.getCqd();
        double variance = variancePct.abs().doubleValue();

        if (variance <= cqd.getCostAlignedMax()) return CQDState.ALIGNED;
        if (variance <= cqd.getCostTensionMax()) return CQDState.UNDER_TENSION;
        return CQDState.DEGRADED;
    }

    // ── Private: Quality Calculation ───────────────────────────────────

    private int calculateQualityScore(UUID projectId) {
        List<ProjectIndicator> qualityIndicators = projectIndicatorRepository.findActiveQualityIndicators(projectId);

        if (qualityIndicators.isEmpty()) {
            return 100; // No quality indicators = assumed OK
        }

        double totalScore = 0;
        double totalWeight = 0;

        for (ProjectIndicator pi : qualityIndicators) {
            if (pi.getCurrentScore() == null) continue;
            double weight = pi.getWeight().doubleValue();
            totalScore += pi.getCurrentScore() * weight;
            totalWeight += weight;
        }

        if (totalWeight == 0) return 100;
        return (int) Math.round(totalScore / totalWeight);
    }

    private CQDState determineQualityState(int qualityScore) {
        MeteoProperties.Cqd cqd = meteoProperties.getCqd();

        if (qualityScore >= cqd.getQualityAlignedMin()) return CQDState.ALIGNED;
        if (qualityScore >= cqd.getQualityTensionMin()) return CQDState.UNDER_TENSION;
        return CQDState.DEGRADED;
    }

    // ── Private: Delay Calculation ─────────────────────────────────────

    private BigDecimal calculateDelayVariance(Project project, UUID projectId) {
        BigDecimal plannedProgress = calculatePlannedProgress(project);
        BigDecimal actualProgress = calculateActualProgress(projectId);

        if (plannedProgress.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        // Negative variance means behind schedule
        // variance = (actual - planned) / planned * 100
        return actualProgress.subtract(plannedProgress)
                .divide(plannedProgress, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculatePlannedProgress(Project project) {
        LocalDate start = project.getStartDate();
        LocalDate end = project.getEndDate();
        LocalDate now = LocalDate.now();

        if (now.isAfter(end)) return BigDecimal.valueOf(100);
        if (now.isBefore(start)) return BigDecimal.ZERO;

        long totalDays = ChronoUnit.DAYS.between(start, end);
        if (totalDays <= 0) return BigDecimal.valueOf(100);

        long elapsedDays = ChronoUnit.DAYS.between(start, now);
        return BigDecimal.valueOf(elapsedDays)
                .divide(BigDecimal.valueOf(totalDays), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateActualProgress(UUID projectId) {
        long sumWeighted = actionRepository.sumWeightedProgress(projectId);
        long sumDuration = actionRepository.sumDurationDays(projectId);

        if (sumDuration == 0) return BigDecimal.ZERO;

        return BigDecimal.valueOf(sumWeighted)
                .divide(BigDecimal.valueOf(sumDuration), 4, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private CQDState determineDelayState(BigDecimal variancePct) {
        MeteoProperties.Cqd cqd = meteoProperties.getCqd();
        double variance = variancePct.doubleValue();

        // Variance is negative when behind schedule
        if (variance >= cqd.getDelayAlignedMin()) return CQDState.ALIGNED;
        if (variance >= cqd.getDelayTensionMin()) return CQDState.UNDER_TENSION;
        return CQDState.DEGRADED;
    }

    // ── Private: Helpers ───────────────────────────────────────────────

    private CQDState worstState(CQDState... states) {
        CQDState worst = CQDState.ALIGNED;
        for (CQDState state : states) {
            if (state == CQDState.DEGRADED) return CQDState.DEGRADED;
            if (state == CQDState.UNDER_TENSION) worst = CQDState.UNDER_TENSION;
        }
        return worst;
    }

    private Trend determineTrend(BigDecimal current, BigDecimal previous, boolean invertedBetter) {
        int comparison = current.compareTo(previous);
        if (comparison == 0) return Trend.STABLE;

        if (invertedBetter) {
            // For cost/delay variance: lower is better
            return comparison < 0 ? Trend.IMPROVING : Trend.DETERIORATING;
        } else {
            // For quality score: higher is better
            return comparison > 0 ? Trend.IMPROVING : Trend.DETERIORATING;
        }
    }

    private CQDHistoryResponse toHistoryResponse(CQDHistory history) {
        return CQDHistoryResponse.builder()
                .id(history.getId())
                .costState(history.getCostState())
                .qualityState(history.getQualityState())
                .delayState(history.getDelayState())
                .costVariancePct(history.getCostVariancePct())
                .qualityScore(history.getQualityScore())
                .delayVariancePct(history.getDelayVariancePct())
                .calculatedAt(history.getCalculationDate())
                .build();
    }

    private String buildCostExplanation(BigDecimal variancePct, Project project) {
        return String.format("Budget variance: %.2f%%. Consumed: %s / Planned: %s",
                variancePct.doubleValue(),
                project.getBudgetConsumed(),
                project.getBudgetTotal());
    }

    private String buildQualityExplanation(int qualityScore, UUID projectId) {
        List<ProjectIndicator> indicators = projectIndicatorRepository.findActiveQualityIndicators(projectId);
        return String.format("Quality score: %d based on %d quality indicators", qualityScore, indicators.size());
    }

    private String buildDelayExplanation(BigDecimal variancePct, BigDecimal planned, BigDecimal actual) {
        return String.format("Schedule variance: %.2f%%. Planned progress: %.2f%%, Actual progress: %.2f%%",
                variancePct.doubleValue(), planned.doubleValue(), actual.doubleValue());
    }
}
