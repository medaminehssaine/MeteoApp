package com.meteoproject.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meteoproject.config.MeteoProperties;
import com.meteoproject.domain.meteo.enums.MeteoState;
import com.meteoproject.domain.projection.Projection;
import com.meteoproject.domain.projection.enums.ConfidenceLevel;
import com.meteoproject.dto.projection.ProjectionHistoryResponse;
import com.meteoproject.dto.projection.ProjectionRequest;
import com.meteoproject.dto.projection.ProjectionResponse;
import com.meteoproject.dto.projection.ProjectionResponse.LayerBreakdown;
import com.meteoproject.dto.projection.ProjectionResponse.RecommendationItem;
import com.meteoproject.dto.projection.ProjectionResponse.ScenarioResult;
import com.meteoproject.exception.ResourceNotFoundException;
import com.meteoproject.repository.ProjectRepository;
import com.meteoproject.repository.ProjectionRepository;
import com.meteoproject.service.ai.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectionService {

    private final TrendAnalyzer trendAnalyzer;
    private final PlanSimulator planSimulator;
    private final ActionPlanEvaluator actionPlanEvaluator;
    private final RiskIntegrator riskIntegrator;
    private final CapacityAnalyzer capacityAnalyzer;
    private final ConfidenceCalculator confidenceCalculator;
    private final ExplanationEngine explanationEngine;
    private final RecommendationEngine recommendationEngine;
    private final ProjectionRepository projectionRepository;
    private final ProjectRepository projectRepository;
    private final MeteoProperties meteoProperties;
    private final ObjectMapper objectMapper;

    @Transactional
    public ProjectionResponse generateProjection(UUID projectId, ProjectionRequest request) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }

        int horizonDays = request.getHorizonDays();
        MeteoProperties.Weights weights = meteoProperties.getAi().getWeights();

        LayerResult trendResult = trendAnalyzer.analyze(projectId, horizonDays);
        LayerResult simResult = planSimulator.simulate(projectId, horizonDays);
        LayerResult planResult = actionPlanEvaluator.evaluate(projectId);
        LayerResult riskResult = riskIntegrator.evaluate(projectId);
        LayerResult capResult = capacityAnalyzer.analyze(projectId);

        double compositeScore =
                trendResult.getScore() * weights.getTrend()
                + simResult.getScore() * weights.getSimulation()
                + planResult.getScore() * weights.getActionPlan()
                + riskResult.getScore() * weights.getRisk()
                + capResult.getScore() * weights.getCapacity();
        compositeScore = Math.max(0, Math.min(100, compositeScore));

        MeteoState projectedState = scoreToState(compositeScore);

        double confidence = confidenceCalculator.calculate(
                trendResult, simResult, planResult, riskResult, capResult, horizonDays);
        ConfidenceLevel confidenceLevel = confidenceCalculator.toLevel(confidence);

        List<String> explanations = explanationEngine.generate(
                trendResult, simResult, planResult, riskResult, capResult,
                compositeScore, projectedState, horizonDays);

        List<RecommendationItem> recommendations = recommendationEngine.generate(
                trendResult, simResult, planResult, riskResult, capResult);

        double[] scenarioScores = planSimulator.getScenarioScores(projectId, horizonDays);

        ScenarioResult nominal = buildScenario("Nominal", 0.50, scenarioScores[0], horizonDays);
        ScenarioResult optimistic = buildScenario("Optimistic", 0.25, scenarioScores[1], horizonDays);
        ScenarioResult pessimistic = buildScenario("Pessimistic", 0.25, scenarioScores[2], horizonDays);

        Projection entity = saveProjection(projectId, horizonDays, compositeScore, projectedState,
                confidenceLevel, confidence, trendResult, simResult, planResult, riskResult, capResult,
                explanations, recommendations, nominal, optimistic, pessimistic);

        log.info("Projection generated for project {}: score={}, state={}, confidence={}",
                projectId, compositeScore, projectedState, confidence);

        return ProjectionResponse.builder()
                .id(entity.getId())
                .projectId(projectId)
                .horizonDays(horizonDays)
                .calculatedAt(entity.getCreatedAt())
                .nominalScenario(nominal)
                .optimisticScenario(optimistic)
                .pessimisticScenario(pessimistic)
                .confidence(confidence)
                .confidenceLevel(confidenceLevel)
                .layerBreakdown(LayerBreakdown.builder()
                        .trend(toLayerResponse(trendResult, weights.getTrend()))
                        .simulation(toLayerResponse(simResult, weights.getSimulation()))
                        .actionPlan(toLayerResponse(planResult, weights.getActionPlan()))
                        .risk(toLayerResponse(riskResult, weights.getRisk()))
                        .capacity(toLayerResponse(capResult, weights.getCapacity()))
                        .compositeScore(compositeScore)
                        .build())
                .explanations(explanations)
                .recommendations(recommendations)
                .build();
    }

    public ProjectionResponse getLatestProjection(UUID projectId) {
        Projection projection = projectionRepository
                .findTopByProjectIdOrderByCreatedAtDesc(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projection", "projectId", projectId));
        return toResponse(projection);
    }

    public Page<ProjectionHistoryResponse> getProjectionHistory(UUID projectId, Pageable pageable) {
        return projectionRepository
                .findByProjectIdOrderByCreatedAtDesc(projectId, pageable)
                .map(this::toHistoryResponse);
    }

    private MeteoState scoreToState(double score) {
        MeteoProperties.Thresholds t = meteoProperties.getThresholds();
        if (score >= t.getSoleil()) return MeteoState.SOLEIL;
        if (score >= t.getNuageClair()) return MeteoState.NUAGE_CLAIR;
        if (score >= t.getNuageCharge()) return MeteoState.NUAGE_CHARGE;
        return MeteoState.ORAGE;
    }

    private ScenarioResult buildScenario(String name, double probability, double score, int horizonDays) {
        return ScenarioResult.builder()
                .name(name)
                .probability(probability)
                .projectedState(scoreToState(score))
                .projectedScore((int) Math.round(score))
                .projectedProgress(score)
                .completionDate(LocalDate.now().plusDays(horizonDays).toString())
                .budgetAtCompletion(0)
                .build();
    }

    private ProjectionResponse.LayerResult toLayerResponse(LayerResult lr, double weight) {
        return ProjectionResponse.LayerResult.builder()
                .layerName(lr.getLayerName())
                .weight(weight)
                .score(lr.getScore())
                .confidence(lr.getConfidence())
                .explanation(lr.getExplanation())
                .build();
    }

    private Projection saveProjection(UUID projectId, int horizonDays, double compositeScore,
                                       MeteoState state, ConfidenceLevel level, double confidence,
                                       LayerResult trend, LayerResult sim, LayerResult plan,
                                       LayerResult risk, LayerResult cap,
                                       List<String> explanations, List<RecommendationItem> recommendations,
                                       ScenarioResult nominal, ScenarioResult optimistic, ScenarioResult pessimistic) {
        Projection entity = Projection.builder()
                .projectId(projectId)
                .horizonDays(horizonDays)
                .targetDate(LocalDate.now().plusDays(horizonDays))
                .projectedMeteo(state)
                .projectedScore(BigDecimal.valueOf(compositeScore).setScale(2, RoundingMode.HALF_UP))
                .confidenceLevel(level)
                .confidencePct(BigDecimal.valueOf(confidence * 100).setScale(2, RoundingMode.HALF_UP))
                .trendScore(toBigDecimal(trend.getScore()))
                .simulationScore(toBigDecimal(sim.getScore()))
                .actionPlanScore(toBigDecimal(plan.getScore()))
                .riskScore(toBigDecimal(risk.getScore()))
                .capacityScore(toBigDecimal(cap.getScore()))
                .explanation(String.join("\n", explanations))
                .scenarios(toJson(List.of(nominal, optimistic, pessimistic)))
                .recommendations(toJson(recommendations))
                .build();
        return projectionRepository.save(entity);
    }

    private ProjectionResponse toResponse(Projection p) {
        return ProjectionResponse.builder()
                .id(p.getId())
                .projectId(p.getProjectId())
                .horizonDays(p.getHorizonDays())
                .calculatedAt(p.getCreatedAt())
                .confidence(p.getConfidencePct().doubleValue() / 100.0)
                .confidenceLevel(p.getConfidenceLevel())
                .layerBreakdown(LayerBreakdown.builder()
                        .trend(ProjectionResponse.LayerResult.builder()
                                .layerName("Trend").score(p.getTrendScore().doubleValue())
                                .weight(meteoProperties.getAi().getWeights().getTrend()).build())
                        .simulation(ProjectionResponse.LayerResult.builder()
                                .layerName("Simulation").score(p.getSimulationScore().doubleValue())
                                .weight(meteoProperties.getAi().getWeights().getSimulation()).build())
                        .actionPlan(ProjectionResponse.LayerResult.builder()
                                .layerName("ActionPlan").score(p.getActionPlanScore().doubleValue())
                                .weight(meteoProperties.getAi().getWeights().getActionPlan()).build())
                        .risk(ProjectionResponse.LayerResult.builder()
                                .layerName("Risk").score(p.getRiskScore().doubleValue())
                                .weight(meteoProperties.getAi().getWeights().getRisk()).build())
                        .capacity(ProjectionResponse.LayerResult.builder()
                                .layerName("Capacity").score(p.getCapacityScore().doubleValue())
                                .weight(meteoProperties.getAi().getWeights().getCapacity()).build())
                        .compositeScore(p.getProjectedScore().doubleValue())
                        .build())
                .build();
    }

    private ProjectionHistoryResponse toHistoryResponse(Projection p) {
        return ProjectionHistoryResponse.builder()
                .id(p.getId())
                .horizonDays(p.getHorizonDays())
                .projectedState(p.getProjectedMeteo())
                .projectedScore(p.getProjectedScore().intValue())
                .confidence(p.getConfidencePct().doubleValue() / 100.0)
                .confidenceLevel(p.getConfidenceLevel())
                .calculatedAt(p.getCreatedAt())
                .build();
    }

    private BigDecimal toBigDecimal(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize to JSON", e);
            return "[]";
        }
    }
}
