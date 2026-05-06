package com.meteoproject.dto.risk;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateRiskRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 500, message = "Title must not exceed 500 characters")
    private String title;

    private String description;

    @NotNull(message = "Category is required")
    private String category;

    @NotNull(message = "Probability is required")
    @Min(value = 1, message = "Probability must be at least 1")
    @Max(value = 5, message = "Probability must be at most 5")
    private Integer probability;

    @NotNull(message = "Impact is required")
    @Min(value = 1, message = "Impact must be at least 1")
    @Max(value = 5, message = "Impact must be at most 5")
    private Integer impact;

    private String mitigationPlan;

    private UUID ownerId;
}
