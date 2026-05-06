package com.meteoproject.dto.cqd;

import com.meteoproject.domain.cqd.enums.CQDState;
import com.meteoproject.domain.cqd.enums.Trend;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class CQDResponse {
    private UUID projectId;
    private CQDState costState;
    private CQDState qualityState;
    private CQDState delayState;
    private BigDecimal costVariancePct;
    private Integer qualityScore;
    private BigDecimal delayVariancePct;
    private CQDState overallState;
    private LocalDate calculatedAt;
    private Trend costTrend;
    private Trend qualityTrend;
    private Trend delayTrend;
}
