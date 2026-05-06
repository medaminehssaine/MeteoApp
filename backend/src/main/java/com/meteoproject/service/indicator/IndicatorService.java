package com.meteoproject.service.indicator;

import com.meteoproject.config.MeteoProperties;
import com.meteoproject.domain.indicator.IndicatorLibrary;
import com.meteoproject.domain.indicator.IndicatorValueHistory;
import com.meteoproject.domain.indicator.ProjectIndicator;
import com.meteoproject.domain.indicator.enums.IndicatorCategory;
import com.meteoproject.domain.indicator.enums.IndicatorState;
import com.meteoproject.domain.indicator.enums.Frequency;
import com.meteoproject.domain.project.Project;
import com.meteoproject.domain.project.enums.Criticality;
import com.meteoproject.domain.user.User;
import com.meteoproject.dto.indicator.*;
import com.meteoproject.exception.BusinessRuleException;
import com.meteoproject.exception.ResourceNotFoundException;
import com.meteoproject.repository.IndicatorLibraryRepository;
import com.meteoproject.repository.IndicatorValueHistoryRepository;
import com.meteoproject.repository.ProjectIndicatorRepository;
import com.meteoproject.repository.ProjectRepository;
import com.meteoproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class IndicatorService {

    private final IndicatorLibraryRepository indicatorLibraryRepository;
    private final ProjectIndicatorRepository projectIndicatorRepository;
    private final IndicatorValueHistoryRepository indicatorValueHistoryRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final MeteoProperties meteoProperties;

    /**
     * Get the indicator library, optionally filtered by category.
     */
    public List<IndicatorLibraryResponse> getLibrary(IndicatorCategory category) {
        List<IndicatorLibrary> indicators;
        if (category != null) {
            indicators = indicatorLibraryRepository.findByCategoryAndIsActiveTrue(category);
        } else {
            indicators = indicatorLibraryRepository.findByIsActiveTrue();
        }
        return indicators.stream()
                .map(this::toLibraryResponse)
                .toList();
    }

    /**
     * Assign an indicator from the library to a project.
     */
    @Transactional
    public ProjectIndicatorResponse assignIndicator(UUID projectId, AssignIndicatorRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        IndicatorLibrary library = indicatorLibraryRepository.findById(request.getIndicatorId())
                .orElseThrow(() -> new ResourceNotFoundException("IndicatorLibrary", "id", request.getIndicatorId()));

        if (projectIndicatorRepository.existsByProjectIdAndIndicatorLibraryId(projectId, library.getId())) {
            throw new BusinessRuleException("DUPLICATE_INDICATOR",
                    "Indicator '" + library.getCode() + "' is already assigned to this project");
        }

        Criticality criticality = request.getCriticality() != null
                ? Criticality.valueOf(request.getCriticality().toUpperCase())
                : Criticality.MEDIUM;

        Frequency frequency = request.getFrequency() != null
                ? Frequency.valueOf(request.getFrequency().toUpperCase())
                : Frequency.WEEKLY;

        double critCoeff = meteoProperties.getCriticalityCoefficient(criticality.name());

        BigDecimal thresholdGreen = request.getTargetValue();
        BigDecimal thresholdOrange = request.getMinValue() != null
                ? request.getMinValue()
                : library.getDefaultThresholdOrange();
        BigDecimal thresholdRed = request.getMaxValue() != null
                ? request.getMaxValue()
                : library.getDefaultThresholdRed();

        BigDecimal weight = request.getWeight() != null
                ? request.getWeight()
                : library.getDefaultWeight();

        ProjectIndicator pi = ProjectIndicator.builder()
                .project(project)
                .indicatorLibrary(library)
                .thresholdGreen(thresholdGreen)
                .thresholdOrange(thresholdOrange)
                .thresholdRed(thresholdRed)
                .weight(weight)
                .criticality(criticality)
                .criticalityCoefficient(BigDecimal.valueOf(critCoeff))
                .frequency(frequency)
                .isActive(true)
                .build();

        pi = projectIndicatorRepository.save(pi);
        log.info("Assigned indicator {} to project {}", library.getCode(), projectId);

        return toProjectIndicatorResponse(pi);
    }

    /**
     * Get all active indicators for a project.
     */
    public List<ProjectIndicatorResponse> getProjectIndicators(UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }
        return projectIndicatorRepository.findByProjectIdAndIsActiveTrue(projectId).stream()
                .map(this::toProjectIndicatorResponse)
                .toList();
    }

    /**
     * Update the current value of a project indicator.
     * Calculates the score and saves a history entry.
     */
    @Transactional
    public ProjectIndicatorResponse updateIndicatorValue(UUID projectIndicatorId, UUID userId,
                                                          UpdateIndicatorValueRequest request) {
        ProjectIndicator pi = projectIndicatorRepository.findById(projectIndicatorId)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectIndicator", "id", projectIndicatorId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        BigDecimal value = request.getValue();
        int score = calculateScore(value, pi);
        IndicatorState state = getIndicatorState(score);

        pi.setCurrentValue(value);
        pi.setCurrentScore(score);
        pi.setLastMeasuredAt(LocalDate.now());
        pi = projectIndicatorRepository.save(pi);

        IndicatorValueHistory history = IndicatorValueHistory.builder()
                .projectIndicator(pi)
                .value(value)
                .score(score)
                .state(state)
                .measuredAt(LocalDate.now())
                .comment(request.getComment())
                .recordedBy(user)
                .build();
        indicatorValueHistoryRepository.save(history);

        log.info("Updated indicator {} value to {}, score={}", projectIndicatorId, value, score);

        return toProjectIndicatorResponse(pi);
    }

    /**
     * Get paginated history for a project indicator.
     */
    public List<IndicatorHistoryResponse> getIndicatorHistory(UUID projectIndicatorId, Pageable pageable) {
        if (!projectIndicatorRepository.existsById(projectIndicatorId)) {
            throw new ResourceNotFoundException("ProjectIndicator", "id", projectIndicatorId);
        }
        return indicatorValueHistoryRepository.findRecentHistory(projectIndicatorId, pageable).stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    /**
     * Calculate the global score summary for a project.
     * globalScore = sum(score * weight * criticalityCoeff) / sum(weight * criticalityCoeff)
     */
    public IndicatorScoreSummary calculateGlobalScore(UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }

        List<ProjectIndicator> indicators = projectIndicatorRepository.findByProjectIdAndIsActiveTrue(projectId);

        double weightedScoreSum = 0.0;
        double weightedDenominator = 0.0;
        int criticalCount = 0;

        Map<IndicatorCategory, double[]> categoryAccumulator = new EnumMap<>(IndicatorCategory.class);

        for (ProjectIndicator pi : indicators) {
            if (pi.getCurrentScore() == null) {
                continue;
            }

            double score = pi.getCurrentScore();
            double weight = pi.getWeight().doubleValue();
            double critCoeff = pi.getCriticalityCoefficient().doubleValue();
            double weighted = weight * critCoeff;

            weightedScoreSum += score * weighted;
            weightedDenominator += weighted;

            if (score < 50) {
                criticalCount++;
            }

            IndicatorCategory category = pi.getIndicatorLibrary().getCategory();
            categoryAccumulator.computeIfAbsent(category, k -> new double[2]);
            double[] acc = categoryAccumulator.get(category);
            acc[0] += score * weighted;
            acc[1] += weighted;
        }

        double globalScore = weightedDenominator > 0
                ? weightedScoreSum / weightedDenominator
                : 0.0;

        Map<IndicatorCategory, Double> categoryScores = new EnumMap<>(IndicatorCategory.class);
        for (Map.Entry<IndicatorCategory, double[]> entry : categoryAccumulator.entrySet()) {
            double[] acc = entry.getValue();
            categoryScores.put(entry.getKey(), acc[1] > 0 ? acc[0] / acc[1] : 0.0);
        }

        return IndicatorScoreSummary.builder()
                .projectId(projectId)
                .globalScore(Math.round(globalScore * 100.0) / 100.0)
                .categoryScores(categoryScores)
                .indicatorCount(indicators.size())
                .criticalCount(criticalCount)
                .build();
    }

    /**
     * Determine indicator state from score.
     * 85-100 EXCELLENT, 70-84 GOOD, 50-69 WARNING, 0-49 CRITICAL
     */
    public IndicatorState getIndicatorState(int score) {
        if (score >= 85) return IndicatorState.EXCELLENT;
        if (score >= 70) return IndicatorState.GOOD;
        if (score >= 50) return IndicatorState.WARNING;
        return IndicatorState.CRITICAL;
    }

    // ---- Private helpers ----

    /**
     * Calculate score for a value given a ProjectIndicator's thresholds.
     * For normal indicators: score = ((value - red) / (green - red)) * 100, clamped 0-100
     * For inverted indicators: score = ((red - value) / (red - green)) * 100, clamped 0-100
     */
    int calculateScore(BigDecimal value, ProjectIndicator pi) {
        BigDecimal green = pi.getThresholdGreen();
        BigDecimal red = pi.getThresholdRed();
        boolean inverted = Boolean.TRUE.equals(pi.getIndicatorLibrary().getIsInverted());

        double score;
        if (inverted) {
            // Inverted: lower is better. red is the max (bad), green is the min (good).
            double range = red.doubleValue() - green.doubleValue();
            if (range == 0) {
                score = value.doubleValue() <= green.doubleValue() ? 100.0 : 0.0;
            } else {
                score = ((red.doubleValue() - value.doubleValue()) / range) * 100.0;
            }
        } else {
            // Normal: higher is better. green is the max (good), red is the min (bad).
            double range = green.doubleValue() - red.doubleValue();
            if (range == 0) {
                score = value.doubleValue() >= green.doubleValue() ? 100.0 : 0.0;
            } else {
                score = ((value.doubleValue() - red.doubleValue()) / range) * 100.0;
            }
        }

        return (int) Math.round(Math.max(0, Math.min(100, score)));
    }

    private IndicatorLibraryResponse toLibraryResponse(IndicatorLibrary lib) {
        return IndicatorLibraryResponse.builder()
                .id(lib.getId())
                .code(lib.getCode())
                .name(lib.getName())
                .description(lib.getDescription())
                .category(lib.getCategory())
                .unit(lib.getUnit())
                .isInverted(lib.getIsInverted())
                .build();
    }

    private ProjectIndicatorResponse toProjectIndicatorResponse(ProjectIndicator pi) {
        IndicatorLibrary lib = pi.getIndicatorLibrary();
        Integer score = pi.getCurrentScore();
        IndicatorState state = score != null ? getIndicatorState(score) : null;

        return ProjectIndicatorResponse.builder()
                .id(pi.getId())
                .indicatorCode(lib.getCode())
                .indicatorName(lib.getName())
                .category(lib.getCategory())
                .currentValue(pi.getCurrentValue())
                .thresholdGreen(pi.getThresholdGreen())
                .thresholdOrange(pi.getThresholdOrange())
                .thresholdRed(pi.getThresholdRed())
                .score(score)
                .state(state)
                .weight(pi.getWeight())
                .criticality(pi.getCriticality().name())
                .frequency(pi.getFrequency().name())
                .lastUpdatedAt(pi.getUpdatedAt())
                .build();
    }

    private IndicatorHistoryResponse toHistoryResponse(IndicatorValueHistory history) {
        return IndicatorHistoryResponse.builder()
                .id(history.getId())
                .value(history.getValue())
                .score(history.getScore())
                .measuredAt(history.getMeasuredAt())
                .recordedByName(history.getRecordedBy().getFullName())
                .comment(history.getComment())
                .build();
    }
}
