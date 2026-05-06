package com.meteoproject.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meteoproject.config.MeteoProperties;
import com.meteoproject.domain.indicator.IndicatorLibrary;
import com.meteoproject.domain.indicator.ProjectIndicator;
import com.meteoproject.domain.indicator.enums.IndicatorCategory;
import com.meteoproject.domain.indicator.enums.Unit;
import com.meteoproject.domain.meteo.enums.MeteoState;
import com.meteoproject.domain.project.Project;
import com.meteoproject.dto.meteo.ForcingCheckResult;
import com.meteoproject.repository.ActionRepository;
import com.meteoproject.repository.MeteoHistoryRepository;
import com.meteoproject.repository.ProjectIndicatorRepository;
import com.meteoproject.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MeteoCalculationServiceTest {

    @Mock MeteoHistoryRepository meteoHistoryRepository;
    @Mock ProjectRepository projectRepository;
    @Mock ProjectIndicatorRepository projectIndicatorRepository;
    @Mock ActionRepository actionRepository;

    MeteoCalculationService service;
    MeteoProperties properties;
    UUID projectId;

    @BeforeEach
    void setUp() {
        properties = new MeteoProperties();
        service = new MeteoCalculationService(
                meteoHistoryRepository,
                projectRepository,
                projectIndicatorRepository,
                actionRepository,
                properties,
                new ObjectMapper());
        projectId = UUID.randomUUID();
    }

    @Test
    void calculateGlobalScoreWithNoIndicatorsReturns75() {
        when(projectIndicatorRepository.findByProjectIdAndIsActiveTrue(projectId)).thenReturn(List.of());

        assertThat(service.calculateGlobalScore(projectId)).isEqualByComparingTo("75");
    }

    @Test
    void calculateGlobalScoreWithMixedScoresReturnsWeightedAverage() {
        when(projectIndicatorRepository.findByProjectIdAndIsActiveTrue(projectId)).thenReturn(List.of(
                indicator(90, "1.0", "1.0"),
                indicator(60, "2.0", "1.0"),
                indicator(30, "1.0", "2.0")
        ));

        assertThat(service.calculateGlobalScore(projectId)).isEqualByComparingTo("54.00");
    }

    @Test
    void determineStateMapsScoresToWeatherStates() {
        assertThat(service.determineState(BigDecimal.valueOf(90))).isEqualTo(MeteoState.SOLEIL);
        assertThat(service.determineState(BigDecimal.valueOf(75))).isEqualTo(MeteoState.NUAGE_CLAIR);
        assertThat(service.determineState(BigDecimal.valueOf(60))).isEqualTo(MeteoState.NUAGE_CHARGE);
        assertThat(service.determineState(BigDecimal.valueOf(40))).isEqualTo(MeteoState.ORAGE);
    }

    @Test
    void forcingRuleR20BlockedActionSixDaysIsForced() {
        when(actionRepository.countBlockedOverDays(any(), any(LocalDate.class))).thenReturn(1L);
        when(actionRepository.countByProjectId(projectId)).thenReturn(0L);
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());
        when(projectIndicatorRepository.findByProjectIdAndIsActiveTrue(projectId)).thenReturn(List.of());
        when(projectIndicatorRepository.findCriticalWithoutAction(projectId)).thenReturn(List.of());

        ForcingCheckResult result = service.checkForcingRules(projectId);

        assertThat(result.isForced()).isTrue();
        assertThat(result.getForcedBy()).contains("R20");
    }

    @Test
    void forcingRuleR22BudgetAt130PercentIsForced() {
        when(actionRepository.countByProjectId(projectId)).thenReturn(0L);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(Project.builder()
                .budgetTotal(BigDecimal.valueOf(100))
                .budgetConsumed(BigDecimal.valueOf(130))
                .build()));
        when(projectIndicatorRepository.findByProjectIdAndIsActiveTrue(projectId)).thenReturn(List.of());
        when(projectIndicatorRepository.findCriticalWithoutAction(projectId)).thenReturn(List.of());

        ForcingCheckResult result = service.checkForcingRules(projectId);

        assertThat(result.isForced()).isTrue();
        assertThat(result.getForcedBy()).contains("R22");
    }

    @Test
    void forcingRuleR21ThirtyFivePercentLateIsForced() {
        when(actionRepository.countByProjectId(projectId)).thenReturn(20L);
        when(actionRepository.countLateActions(projectId)).thenReturn(7L);
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());
        when(projectIndicatorRepository.findByProjectIdAndIsActiveTrue(projectId)).thenReturn(List.of());
        when(projectIndicatorRepository.findCriticalWithoutAction(projectId)).thenReturn(List.of());

        ForcingCheckResult result = service.checkForcingRules(projectId);

        assertThat(result.isForced()).isTrue();
        assertThat(result.getForcedBy()).contains("R21");
    }

    private ProjectIndicator indicator(int score, String weight, String criticalityCoefficient) {
        IndicatorLibrary library = IndicatorLibrary.builder()
                .code("I" + score)
                .name("Indicator " + score)
                .category(IndicatorCategory.QUALITY)
                .unit(Unit.PERCENTAGE)
                .build();
        return ProjectIndicator.builder()
                .indicatorLibrary(library)
                .currentScore(score)
                .weight(new BigDecimal(weight))
                .criticalityCoefficient(new BigDecimal(criticalityCoefficient))
                .build();
    }
}
