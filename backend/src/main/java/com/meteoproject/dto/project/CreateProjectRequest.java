package com.meteoproject.dto.project;

import com.meteoproject.domain.project.enums.Criticality;
import com.meteoproject.domain.project.enums.ProjectType;
import com.meteoproject.domain.project.enums.Visibility;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    @Size(max = 200, message = "Project name cannot exceed 200 characters")
    private String name;

    @Size(max = 20, message = "Project code cannot exceed 20 characters")
    private String code;

    private String shortDescription;

    private String longDescription;

    @NotNull(message = "Project type is required")
    private ProjectType type;

    @NotNull(message = "Criticality is required")
    private Criticality criticality;

    private Visibility visibility;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @DecimalMin(value = "0", message = "Budget must be zero or positive")
    private BigDecimal budgetTotal;
}
