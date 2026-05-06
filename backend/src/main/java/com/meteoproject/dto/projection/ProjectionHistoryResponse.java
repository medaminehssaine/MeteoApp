package com.meteoproject.dto.projection;

import com.meteoproject.domain.meteo.enums.MeteoState;
import com.meteoproject.domain.projection.enums.ConfidenceLevel;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ProjectionHistoryResponse {
    private UUID id;
    private int horizonDays;
    private MeteoState projectedState;
    private int projectedScore;
    private double confidence;
    private ConfidenceLevel confidenceLevel;
    private Instant calculatedAt;
}
