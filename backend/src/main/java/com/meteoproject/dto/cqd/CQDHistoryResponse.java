package com.meteoproject.dto.cqd;

import com.meteoproject.domain.cqd.enums.CQDState;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class CQDHistoryResponse {
    private UUID id;
    private CQDState costState;
    private CQDState qualityState;
    private CQDState delayState;
    private BigDecimal costVariancePct;
    private Integer qualityScore;
    private BigDecimal delayVariancePct;
    private LocalDate calculatedAt;
}
