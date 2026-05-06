package com.meteoproject.dto.plan;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateActionRequest {

    @NotNull(message = "Module ID is required")
    private UUID moduleId;

    @NotBlank(message = "Name is required")
    @Size(max = 200, message = "Name must not exceed 200 characters")
    private String name;

    private String description;

    private UUID responsibleId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "Planned end date is required")
    private LocalDate plannedEndDate;

    @DecimalMin(value = "0", message = "Weight must be >= 0")
    @DecimalMax(value = "1", message = "Weight must be <= 1")
    private Double weight;
}
