package com.meteoproject.dto.indicator;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateIndicatorValueRequest {
    @NotNull(message = "Value is required")
    private BigDecimal value;

    private String comment;
}
