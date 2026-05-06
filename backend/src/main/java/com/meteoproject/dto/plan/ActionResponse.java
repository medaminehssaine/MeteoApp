package com.meteoproject.dto.plan;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ActionResponse {

    private UUID id;
    private UUID projectId;
    private UUID moduleId;
    private String moduleName;
    private String name;
    private String description;
    private UUID responsibleId;
    private String responsibleName;
    private String status;
    private String blockingType;
    private String blockingReason;
    private LocalDate startDate;
    private LocalDate plannedEndDate;
    private LocalDate actualEndDate;
    private Integer durationDays;
    private Double weight;
    private Integer progressPercent;
    private boolean isLate;
    private int remainingDays;
    private long blockedDays;
    private Boolean isMilestone;
    private Integer orderIndex;
    private List<DependencyResponse> dependencies;
    private Instant createdAt;
    private Instant updatedAt;
}
