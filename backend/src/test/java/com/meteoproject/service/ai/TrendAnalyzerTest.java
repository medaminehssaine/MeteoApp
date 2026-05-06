package com.meteoproject.service.ai;

import com.meteoproject.config.MeteoProperties;
import com.meteoproject.domain.meteo.MeteoHistory;
import com.meteoproject.repository.MeteoHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrendAnalyzerTest {

    @Mock MeteoHistoryRepository meteoHistoryRepository;

    TrendAnalyzer analyzer;
    UUID projectId;

    @BeforeEach
    void setUp() {
        MeteoProperties properties = new MeteoProperties();
        properties.getAi().setMinHistoryPoints(3);
        properties.getAi().setMaxHistoryPoints(10);
        analyzer = new TrendAnalyzer(meteoHistoryRepository, properties);
        projectId = UUID.randomUUID();
    }

    @Test
    void emptyHistoryReturnsDefaultScoreAndLowConfidence() {
        when(meteoHistoryRepository.findByProjectIdOrderByCalculationDateDesc(any(), any()))
                .thenReturn(new PageImpl<>(List.of()));

        LayerResult result = analyzer.analyze(projectId, 14);

        assertThat(result.getScore()).isEqualTo(50.0);
        assertThat(result.getConfidence()).isEqualTo(0.3);
    }

    @Test
    void fiveAscendingScoresProducePositiveProjectionAboveLastScore() {
        when(meteoHistoryRepository.findByProjectIdOrderByCalculationDateDesc(any(), any()))
                .thenReturn(new PageImpl<>(historyDesc(90, 80, 70, 60, 50)));

        LayerResult result = analyzer.analyze(projectId, 14);

        assertThat(result.getScore()).isGreaterThan(90.0);
        assertThat(result.getExplanation()).contains("upward");
    }

    @Test
    void fiveDescendingScoresProduceNegativeProjectionBelowLastScore() {
        when(meteoHistoryRepository.findByProjectIdOrderByCalculationDateDesc(any(), any()))
                .thenReturn(new PageImpl<>(historyDesc(50, 60, 70, 80, 90)));

        LayerResult result = analyzer.analyze(projectId, 14);

        assertThat(result.getScore()).isLessThan(50.0);
        assertThat(result.getExplanation()).contains("downward");
    }

    @Test
    void blendedScoreIsSixtyPercentProjectedAndFortyPercentWma() {
        when(meteoHistoryRepository.findByProjectIdOrderByCalculationDateDesc(any(), any()))
                .thenReturn(new PageImpl<>(historyDesc(70, 70, 70, 70, 70)));

        LayerResult result = analyzer.analyze(projectId, 14);

        assertThat(result.getScore()).isEqualTo(70.0);
    }

    private List<MeteoHistory> historyDesc(int... scores) {
        return Arrays.stream(scores)
                .mapToObj(score -> MeteoHistory.builder()
                        .projectId(projectId)
                        .calculationDate(LocalDate.now())
                        .calculatedScore(BigDecimal.valueOf(score))
                        .build())
                .toList();
    }
}
