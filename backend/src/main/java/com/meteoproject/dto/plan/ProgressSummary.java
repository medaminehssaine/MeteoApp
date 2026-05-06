package com.meteoproject.dto.plan;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ProgressSummary {

    private UUID projectId;
    private double overallProgress;
    private List<ModuleProgress> moduleProgresses;
    private long totalActions;
    private long completedActions;
    private long lateActions;
    private long blockedActions;

    @Data
    @Builder
    public static class ModuleProgress {
        private UUID moduleId;
        private String moduleName;
        private double weight;
        private double progress;
    }
}
