package com.meteoproject.dto.meteo;

import com.meteoproject.domain.cqd.enums.Trend;
import com.meteoproject.domain.meteo.enums.MeteoState;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class MeteoResponse {
    private UUID projectId;
    private MeteoState state;
    private BigDecimal score;
    private boolean forced;
    private String forcedBy;
    private String forcingRule;
    private LocalDate calculatedAt;
    private MeteoState previousState;
    private Trend trend;
    private Integer cqdScore;
    private Integer indicatorScore;
    private Integer riskScore;
    private Integer planScore;
}
