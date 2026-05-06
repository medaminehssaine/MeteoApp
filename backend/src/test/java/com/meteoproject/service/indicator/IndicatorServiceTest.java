package com.meteoproject.service.indicator;

import com.meteoproject.config.MeteoProperties;
import com.meteoproject.domain.indicator.IndicatorLibrary;
import com.meteoproject.domain.indicator.ProjectIndicator;
import com.meteoproject.domain.indicator.enums.IndicatorCategory;
import com.meteoproject.domain.indicator.enums.Unit;
import com.meteoproject.repository.IndicatorLibraryRepository;
import com.meteoproject.repository.IndicatorValueHistoryRepository;
import com.meteoproject.repository.ProjectIndicatorRepository;
import com.meteoproject.repository.ProjectRepository;
import com.meteoproject.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class IndicatorServiceTest {

    @Mock IndicatorLibraryRepository indicatorLibraryRepository;
    @Mock ProjectIndicatorRepository projectIndicatorRepository;
    @Mock IndicatorValueHistoryRepository indicatorValueHistoryRepository;
    @Mock ProjectRepository projectRepository;
    @Mock UserRepository userRepository;

    IndicatorService service;

    @BeforeEach
    void setUp() {
        service = new IndicatorService(
                indicatorLibraryRepository,
                projectIndicatorRepository,
                indicatorValueHistoryRepository,
                projectRepository,
                userRepository,
                new MeteoProperties());
    }

    @Test
    void calculateScoreNormalIndicator() {
        assertThat(service.calculateScore(BigDecimal.valueOf(80), indicator(false, 90, 75, 50))).isEqualTo(75);
    }

    @Test
    void calculateScoreInvertedIndicator() {
        assertThat(service.calculateScore(BigDecimal.valueOf(10), indicator(true, 5, 15, 30))).isEqualTo(80);
    }

    @Test
    void calculateScoreAtGreenThresholdReturns100() {
        assertThat(service.calculateScore(BigDecimal.valueOf(90), indicator(false, 90, 75, 50))).isEqualTo(100);
    }

    @Test
    void calculateScoreAboveGreenIsCappedAt100() {
        assertThat(service.calculateScore(BigDecimal.valueOf(120), indicator(false, 90, 75, 50))).isEqualTo(100);
    }

    private ProjectIndicator indicator(boolean inverted, int green, int orange, int red) {
        IndicatorLibrary library = IndicatorLibrary.builder()
                .code("TEST")
                .name("Test")
                .category(IndicatorCategory.QUALITY)
                .unit(Unit.PERCENTAGE)
                .isInverted(inverted)
                .build();
        return ProjectIndicator.builder()
                .indicatorLibrary(library)
                .thresholdGreen(BigDecimal.valueOf(green))
                .thresholdOrange(BigDecimal.valueOf(orange))
                .thresholdRed(BigDecimal.valueOf(red))
                .build();
    }
}
