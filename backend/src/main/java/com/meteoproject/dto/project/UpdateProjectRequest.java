package com.meteoproject.dto.project;

import com.meteoproject.domain.project.enums.Criticality;
import com.meteoproject.domain.project.enums.ProjectStatus;
import com.meteoproject.domain.project.enums.ProjectType;
import com.meteoproject.domain.project.enums.Visibility;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateProjectRequest {

    @Size(max = 200, message = "Project name cannot exceed 200 characters")
    private String name;

    private String shortDescription;

    private String longDescription;

    private ProjectType type;

    private Criticality criticality;

    private Visibility visibility;

    private ProjectStatus status;

    private LocalDate startDate;

    private LocalDate endDate;

    @DecimalMin(value = "0", message = "Budget must be zero or positive")
    private BigDecimal budgetTotal;
}
