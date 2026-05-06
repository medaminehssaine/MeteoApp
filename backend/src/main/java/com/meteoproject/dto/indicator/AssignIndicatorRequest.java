package com.meteoproject.dto.indicator;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class AssignIndicatorRequest {
    @NotNull(message = "Indicator ID is required")
    private UUID indicatorId;

    @NotNull(message = "Target value (thresholdGreen) is required")
    private BigDecimal targetValue;

    private BigDecimal minValue;

    private BigDecimal maxValue;

    @DecimalMin(value = "0", message = "Weight must be >= 0")
    @DecimalMax(value = "1", message = "Weight must be <= 1")
    private BigDecimal weight;

    private String criticality;

    private String frequency;
}
