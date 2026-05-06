package com.meteoproject.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meteoproject.config.MeteoProperties;
import com.meteoproject.domain.cqd.enums.Trend;
import com.meteoproject.domain.indicator.ProjectIndicator;
import com.meteoproject.domain.meteo.MeteoHistory;
import com.meteoproject.domain.meteo.enums.MeteoState;
import com.meteoproject.domain.project.Project;
import com.meteoproject.dto.meteo.ForcingCheckResult;
import com.meteoproject.dto.meteo.MeteoHistoryResponse;
import com.meteoproject.dto.meteo.MeteoResponse;
import com.meteoproject.exception.ResourceNotFoundException;
import com.meteoproject.repository.ActionRepository;
import com.meteoproject.repository.MeteoHistoryRepository;
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
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class MeteoCalculationService {

    private final MeteoHistoryRepository meteoHistoryRepository;
    private final ProjectRepository projectRepository;
    private final ProjectIndicatorRepository projectIndicatorRepository;
    private final ActionRepository actionRepository;
    private final MeteoProperties meteoProperties;
    private final ObjectMapper objectMapper;

    // ── Public API ──────────────────────────────────────────────────────

    @Transactional
    public MeteoResponse calculateMeteo(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        // Step 1: Calculate indicator global score
        BigDecimal globalScore = calculateGlobalScore(projectId);

        // Step 2: Check all 5 forcing rules
        ForcingCheckResult forcingResult = checkForcingRules(projectId);

        // Step 3: Determine MeteoState
        MeteoState state;
        BigDecimal finalScore;
        if (forcingResult.isForced()) {
            state = MeteoState.ORAGE;
            finalScore = globalScore.min(BigDecimal.valueOf(49));
        } else {
            state = determineState(globalScore);
            finalScore = globalScore;
        }

        // Step 4: Save to MeteoHistory
        String indicatorScoresJson = buildIndicatorScoresJson(projectId);
        String forcingDetailsJson = forcingResult.isForced() ? toJson(forcingResult.getDetails()) : null;

        MeteoHistory history = MeteoHistory.builder()
                .projectId(projectId)
                .calculationDate(LocalDate.now())
                .meteoState(state)
                .calculatedScore(finalScore)
                .rawScore(globalScore)
                .wasForced(forcingResult.isForced())
                .activeForcingRules(forcingDetailsJson)
                .indicatorScores(indicatorScoresJson)
                .triggeredBy("MANUAL")
                .build();

        meteoHistoryRepository.save(history);

        // Step 5: Determine trend by comparing to previous state
        List<MeteoHistory> previousEntries = meteoHistoryRepository.findLatest(projectId, PageRequest.of(0, 2));
        MeteoState previousState = null;
        Trend trend = Trend.STABLE;

        // previousEntries includes the one we just saved, so we need the second one
        if (previousEntries.size() > 1) {
            MeteoHistory previous = previousEntries.get(1);
            previousState = previous.getMeteoState();
            trend = determineTrend(finalScore, previous.getCalculatedScore());
        }

        // Compute category sub-scores
        Map<String, Integer> catScores = calculateCategoryScores(projectId);

        return MeteoResponse.builder()
                .projectId(projectId)
                .state(state)
                .score(finalScore)
                .forced(forcingResult.isForced())
                .forcedBy(forcingResult.getForcedBy())
                .forcingRule(forcingResult.isForced() ? forcingResult.getForcedBy() : null)
                .calculatedAt(LocalDate.now())
                .previousState(previousState)
                .trend(trend)
                .cqdScore(catScores.getOrDefault("CQD", null))
                .indicatorScore(catScores.getOrDefault("GLOBAL", null))
                .riskScore(catScores.getOrDefault("RISK", null))
                .planScore(catScores.getOrDefault("PROGRESS", null))
                .build();
    }

    public ForcingCheckResult checkForcingRules(UUID projectId) {
        Map<String, Object> details = new LinkedHashMap<>();
        List<String> triggeredRules = new ArrayList<>();

        // R20: Any action blocked > N days
        checkR20BlockedActions(projectId, details, triggeredRules);

        // R21: Late actions > 30% of total
        checkR21LateActions(projectId, details, triggeredRules);

        // R22: Budget consumed > 120% of planned
        checkR22BudgetOverrun(projectId, details, triggeredRules);

        // R23: No indicator update > N days
        checkR23NoUpdate(projectId, details, triggeredRules);

        // R24: Any CRITICAL indicator without corrective action
        checkR24CriticalWithoutAction(projectId, details, triggeredRules);

        boolean forced = !triggeredRules.isEmpty();
        String forcedBy = forced ? String.join(", ", triggeredRules) : null;

        return ForcingCheckResult.builder()
                .forced(forced)
                .forcedBy(forcedBy)
                .details(details)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<MeteoHistoryResponse> getMeteoHistory(UUID projectId, Pageable pageable) {
        List<MeteoHistory> entries = meteoHistoryRepository.findLatest(projectId, pageable);

        List<MeteoHistoryResponse> responses = entries.stream()
                .map(this::toHistoryResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, responses.size());
    }

    @Transactional(readOnly = true)
    public MeteoResponse getCurrentMeteo(UUID projectId) {
        List<MeteoHistory> latest = meteoHistoryRepository.findLatest(projectId, PageRequest.of(0, 2));

        if (latest.isEmpty()) {
            return MeteoResponse.builder()
                    .projectId(projectId)
                    .state(MeteoState.NUAGE_CLAIR)
                    .score(BigDecimal.valueOf(75))
                    .forced(false)
                    .calculatedAt(LocalDate.now())
                    .trend(Trend.STABLE)
                    .build();
        }

        MeteoHistory current = latest.get(0);
        MeteoState previousState = null;
        Trend trend = Trend.STABLE;

        if (latest.size() > 1) {
            MeteoHistory previous = latest.get(1);
            previousState = previous.getMeteoState();
            trend = determineTrend(current.getCalculatedScore(), previous.getCalculatedScore());
        }

        Map<String, Integer> catScores = calculateCategoryScores(projectId);

        return MeteoResponse.builder()
                .projectId(projectId)
                .state(current.getMeteoState())
                .score(current.getCalculatedScore())
                .forced(Boolean.TRUE.equals(current.getWasForced()))
                .forcedBy(current.getActiveForcingRules())
                .forcingRule(Boolean.TRUE.equals(current.getWasForced()) ? current.getActiveForcingRules() : null)
                .calculatedAt(current.getCalculationDate())
                .previousState(previousState)
                .trend(trend)
                .cqdScore(catScores.getOrDefault("CQD", null))
                .indicatorScore(catScores.getOrDefault("GLOBAL", null))
                .riskScore(catScores.getOrDefault("RISK", null))
                .planScore(catScores.getOrDefault("PROGRESS", null))
                .build();
    }

    // ── Private: Score Calculation ──────────────────────────────────────

    BigDecimal calculateGlobalScore(UUID projectId) {
        List<ProjectIndicator> indicators = projectIndicatorRepository.findByProjectIdAndIsActiveTrue(projectId);

        if (indicators.isEmpty()) {
            return BigDecimal.valueOf(75);
        }

        BigDecimal totalWeightedScore = BigDecimal.ZERO;
        BigDecimal totalWeight = BigDecimal.ZERO;

        for (ProjectIndicator indicator : indicators) {
            if (indicator.getCurrentScore() == null) {
                continue;
            }

            BigDecimal weight = indicator.getWeight()
                    .multiply(indicator.getCriticalityCoefficient());
            BigDecimal weightedScore = BigDecimal.valueOf(indicator.getCurrentScore())
                    .multiply(weight);

            totalWeightedScore = totalWeightedScore.add(weightedScore);
            totalWeight = totalWeight.add(weight);
        }

        if (totalWeight.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.valueOf(75);
        }

        return totalWeightedScore.divide(totalWeight, 2, RoundingMode.HALF_UP);
    }

    // ── Private: Forcing Rule Checks ───────────────────────────────────

    private void checkR20BlockedActions(UUID projectId, Map<String, Object> details, List<String> triggered) {
        int blockedDays = meteoProperties.getForcing().getBlockedActionDays();
        LocalDate cutoff = LocalDate.now().minusDays(blockedDays);
        long count = actionRepository.countBlockedOverDays(projectId, cutoff);

        details.put("R20_blockedOverDays", Map.of(
                "count", count,
                "threshold", blockedDays,
                "triggered", count > 0
        ));

        if (count > 0) {
            triggered.add("R20");
            log.warn("R20 triggered for project {}: {} actions blocked > {} days", projectId, count, blockedDays);
        }
    }

    private void checkR21LateActions(UUID projectId, Map<String, Object> details, List<String> triggered) {
        long totalActions = actionRepository.countByProjectId(projectId);
        long lateActions = actionRepository.countLateActions(projectId);

        double latePercentage = totalActions > 0 ? (double) lateActions / totalActions * 100.0 : 0.0;
        int threshold = meteoProperties.getForcing().getLateActionsPct();

        details.put("R21_lateActions", Map.of(
                "lateCount", lateActions,
                "totalCount", totalActions,
                "latePercentage", latePercentage,
                "threshold", threshold,
                "triggered", latePercentage > threshold
        ));

        if (latePercentage > threshold) {
            triggered.add("R21");
            log.warn("R21 triggered for project {}: {}/{} actions late ({}%)", projectId, lateActions, totalActions, latePercentage);
        }
    }

    private void checkR22BudgetOverrun(UUID projectId, Map<String, Object> details, List<String> triggered) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null || project.getBudgetTotal().compareTo(BigDecimal.ZERO) == 0) {
            details.put("R22_budgetOverrun", Map.of("triggered", false, "reason", "No budget data"));
            return;
        }

        BigDecimal consumed = project.getBudgetConsumed();
        BigDecimal planned = project.getBudgetTotal();
        double consumedPct = consumed.doubleValue() / planned.doubleValue() * 100.0;
        int threshold = meteoProperties.getForcing().getBudgetOverrunPct();

        details.put("R22_budgetOverrun", Map.of(
                "consumedPct", consumedPct,
                "threshold", threshold,
                "consumed", consumed,
                "planned", planned,
                "triggered", consumedPct > threshold
        ));

        if (consumedPct > threshold) {
            triggered.add("R22");
            log.warn("R22 triggered for project {}: budget at {}% (threshold {}%)", projectId, consumedPct, threshold);
        }
    }

    private void checkR23NoUpdate(UUID projectId, Map<String, Object> details, List<String> triggered) {
        int noUpdateDays = meteoProperties.getForcing().getNoUpdateDays();
        List<ProjectIndicator> indicators = projectIndicatorRepository.findByProjectIdAndIsActiveTrue(projectId);

        if (indicators.isEmpty()) {
            details.put("R23_noUpdate", Map.of("triggered", false, "reason", "No active indicators"));
            return;
        }

        LocalDate cutoff = LocalDate.now().minusDays(noUpdateDays);
        boolean anyStale = indicators.stream()
                .allMatch(pi -> pi.getLastMeasuredAt() == null || pi.getLastMeasuredAt().isBefore(cutoff));

        details.put("R23_noUpdate", Map.of(
                "thresholdDays", noUpdateDays,
                "triggered", anyStale
        ));

        if (anyStale) {
            triggered.add("R23");
            log.warn("R23 triggered for project {}: no indicator update in {} days", projectId, noUpdateDays);
        }
    }

    private void checkR24CriticalWithoutAction(UUID projectId, Map<String, Object> details, List<String> triggered) {
        List<ProjectIndicator> criticalIndicators = projectIndicatorRepository.findCriticalWithoutAction(projectId);

        details.put("R24_criticalWithoutAction", Map.of(
                "count", criticalIndicators.size(),
                "indicators", criticalIndicators.stream()
                        .map(pi -> pi.getIndicatorLibrary().getName())
                        .collect(Collectors.toList()),
                "triggered", !criticalIndicators.isEmpty()
        ));

        if (!criticalIndicators.isEmpty()) {
            triggered.add("R24");
            log.warn("R24 triggered for project {}: {} critical indicators without corrective action",
                    projectId, criticalIndicators.size());
        }
    }

    // ── Private: Category Score Calculation ───────────────────────────

    private Map<String, Integer> calculateCategoryScores(UUID projectId) {
        List<ProjectIndicator> indicators = projectIndicatorRepository.findByProjectIdAndIsActiveTrue(projectId);
        Map<String, Integer> result = new HashMap<>();

        if (indicators.isEmpty()) return result;

        // Group by category and compute weighted average per group
        Map<String, List<ProjectIndicator>> byCategory = indicators.stream()
                .filter(pi -> pi.getCurrentScore() != null)
                .collect(Collectors.groupingBy(pi -> pi.getIndicatorLibrary().getCategory().name()));

        byCategory.forEach((category, catIndicators) -> {
            double totalWeight = catIndicators.stream().mapToDouble(pi -> pi.getWeight().doubleValue()).sum();
            if (totalWeight == 0) return;
            double weightedSum = catIndicators.stream()
                    .mapToDouble(pi -> pi.getCurrentScore() * pi.getWeight().doubleValue()).sum();
            result.put(category, (int) Math.round(weightedSum / totalWeight));
        });

        // GLOBAL = overall weighted average across all indicators
        double totalW = indicators.stream().filter(pi -> pi.getCurrentScore() != null)
                .mapToDouble(pi -> pi.getWeight().doubleValue()).sum();
        if (totalW > 0) {
            double globalSum = indicators.stream().filter(pi -> pi.getCurrentScore() != null)
                    .mapToDouble(pi -> pi.getCurrentScore() * pi.getWeight().doubleValue()).sum();
            result.put("GLOBAL", (int) Math.round(globalSum / totalW));
        }

        return result;
    }

    // ── Private: Helpers ───────────────────────────────────────────────

    MeteoState determineState(BigDecimal score) {
        int s = score.intValue();
        MeteoProperties.Thresholds t = meteoProperties.getThresholds();

        if (s >= t.getSoleil()) return MeteoState.SOLEIL;
        if (s >= t.getNuageClair()) return MeteoState.NUAGE_CLAIR;
        if (s >= t.getNuageCharge()) return MeteoState.NUAGE_CHARGE;
        return MeteoState.ORAGE;
    }

    private Trend determineTrend(BigDecimal current, BigDecimal previous) {
        int comparison = current.compareTo(previous);
        if (comparison > 0) return Trend.IMPROVING;
        if (comparison < 0) return Trend.DETERIORATING;
        return Trend.STABLE;
    }

    private MeteoHistoryResponse toHistoryResponse(MeteoHistory history) {
        return MeteoHistoryResponse.builder()
                .id(history.getId())
                .state(history.getMeteoState())
                .score(history.getCalculatedScore())
                .forced(Boolean.TRUE.equals(history.getWasForced()))
                .forcedBy(history.getActiveForcingRules())
                .calculatedAt(history.getCalculationDate())
                .build();
    }

    private String buildIndicatorScoresJson(UUID projectId) {
        List<ProjectIndicator> indicators = projectIndicatorRepository.findByProjectIdAndIsActiveTrue(projectId);
        Map<String, Object> scores = new LinkedHashMap<>();

        for (ProjectIndicator pi : indicators) {
            scores.put(pi.getIndicatorLibrary().getCode(), Map.of(
                    "name", pi.getIndicatorLibrary().getName(),
                    "score", pi.getCurrentScore() != null ? pi.getCurrentScore() : 0,
                    "weight", pi.getWeight(),
                    "criticality", pi.getCriticality().name()
            ));
        }

        return toJson(scores);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize to JSON", e);
            return "{}";
        }
    }
}
