package com.meteoproject.dto.project;

import com.meteoproject.domain.project.enums.Criticality;
import com.meteoproject.domain.project.enums.ProjectStatus;
import com.meteoproject.domain.project.enums.ProjectType;
import com.meteoproject.domain.project.enums.Visibility;
import com.meteoproject.domain.meteo.enums.MeteoState;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class ProjectSummaryResponse {
    private UUID id;
    private String name;
    private String code;
    private String shortDescription;
    private ProjectType type;
    private ProjectStatus status;
    private Criticality criticality;
    private Visibility visibility;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal budgetTotal;
    private BigDecimal budgetConsumed;
    private String chefName;
    private String sponsorName;
    private String directorName;
    private long daysRemaining;
    private long memberCount;
    private MeteoState currentMeteoState;
    private Integer currentMeteoScore;
    private Instant createdAt;
    private Instant updatedAt;
}
