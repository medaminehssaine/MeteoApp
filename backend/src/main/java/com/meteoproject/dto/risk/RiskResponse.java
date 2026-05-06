package com.meteoproject.dto.risk;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class RiskResponse {

    private UUID id;
    private UUID projectId;
    private String title;
    private String description;
    private String category;
    private Integer probability;
    private Integer impact;
    private Integer severity;
    private String status;
    private String mitigationPlan;
    private String contingencyPlan;
    private UUID ownerId;
    private String ownerName;
    private LocalDate identifiedAt;
    private LocalDate reviewDate;
    private LocalDate materializedAt;
    private LocalDate closedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
