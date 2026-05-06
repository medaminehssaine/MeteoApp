package com.meteoproject.dto.indicator;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class IndicatorHistoryResponse {
    private UUID id;
    private BigDecimal value;
    private Integer score;
    private LocalDate measuredAt;
    private String recordedByName;
    private String comment;
}
