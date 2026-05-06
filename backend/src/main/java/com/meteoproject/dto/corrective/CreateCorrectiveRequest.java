package com.meteoproject.dto.corrective;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateCorrectiveRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 500, message = "Title must not exceed 500 characters")
    private String title;

    private String description;

    @NotNull(message = "Priority is required")
    private String priority;

    private UUID assignedToId;

    private LocalDate dueDate;

    private UUID linkedIndicatorId;

    private UUID linkedRiskId;
}
