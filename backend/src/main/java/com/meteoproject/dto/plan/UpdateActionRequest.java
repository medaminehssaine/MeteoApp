package com.meteoproject.dto.plan;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class UpdateActionRequest {

    private String name;

    private String description;

    private UUID responsibleId;

    private String status;

    private String blockingType;

    private LocalDate startDate;

    private LocalDate plannedEndDate;

    private LocalDate actualEndDate;

    private Double weight;

    @Min(value = 0, message = "Progress must be >= 0")
    @Max(value = 100, message = "Progress must be <= 100")
    private Integer progressPercent;
}
