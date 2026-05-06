package com.meteoproject.dto.meteo;

import com.meteoproject.domain.meteo.enums.MeteoState;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class MeteoHistoryResponse {
    private UUID id;
    private MeteoState state;
    private BigDecimal score;
    private boolean forced;
    private String forcedBy;
    private LocalDate calculatedAt;
}
