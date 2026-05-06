package com.meteoproject.dto.risk;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.UUID;

@Data
public class UpdateRiskRequest {

    @Size(max = 500, message = "Title must not exceed 500 characters")
    private String title;

    private String description;

    private String category;

    @Min(value = 1, message = "Probability must be at least 1")
    @Max(value = 5, message = "Probability must be at most 5")
    private Integer probability;

    @Min(value = 1, message = "Impact must be at least 1")
    @Max(value = 5, message = "Impact must be at most 5")
    private Integer impact;

    private String status;

    private String mitigationPlan;

    private UUID ownerId;
}
