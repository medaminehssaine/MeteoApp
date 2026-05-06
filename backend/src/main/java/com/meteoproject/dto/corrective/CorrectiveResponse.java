package com.meteoproject.dto.corrective;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class CorrectiveResponse {

    private UUID id;
    private UUID projectId;
    private String title;
    private String description;
    private String priority;
    private String status;
    private UUID assignedToId;
    private String assignedToName;
    private UUID createdById;
    private String createdByName;
    private LocalDate dueDate;
    private LocalDate completedAt;
    private UUID linkedIndicatorId;
    private UUID linkedRiskId;
    private boolean isOverdue;
    private Instant createdAt;
    private Instant updatedAt;
}
