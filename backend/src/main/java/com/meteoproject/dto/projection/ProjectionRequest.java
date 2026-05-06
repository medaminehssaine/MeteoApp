package com.meteoproject.dto.projection;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class ProjectionRequest {
    @Min(value = 7, message = "Horizon must be at least 7 days")
    @Max(value = 365, message = "Horizon cannot exceed 365 days")
    private int horizonDays = 30;

    @Min(value = 50, message = "Minimum 50 Monte Carlo iterations")
    @Max(value = 500, message = "Maximum 500 Monte Carlo iterations")
    private int monteCarloIterations = 100;
}
