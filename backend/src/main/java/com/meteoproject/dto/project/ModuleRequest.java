package com.meteoproject.dto.project;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ModuleRequest {

    @NotBlank(message = "Module name is required")
    private String name;

    private String description;

    @DecimalMin(value = "0", message = "Weight must be at least 0")
    @DecimalMax(value = "1", message = "Weight must be at most 1")
    private BigDecimal weight;
}
