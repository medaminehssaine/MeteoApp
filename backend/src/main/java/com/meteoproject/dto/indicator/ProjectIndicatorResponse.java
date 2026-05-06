package com.meteoproject.dto.indicator;

import com.meteoproject.domain.indicator.enums.IndicatorCategory;
import com.meteoproject.domain.indicator.enums.IndicatorState;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ProjectIndicatorResponse {
    private UUID id;
    private String indicatorCode;
    private String indicatorName;
    private IndicatorCategory category;
    private BigDecimal currentValue;
    private BigDecimal thresholdGreen;
    private BigDecimal thresholdOrange;
    private BigDecimal thresholdRed;
    private Integer score;
    private IndicatorState state;
    private BigDecimal weight;
    private String criticality;
    private String frequency;
    private Instant lastUpdatedAt;
}
