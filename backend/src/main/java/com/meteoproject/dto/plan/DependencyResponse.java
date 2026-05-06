package com.meteoproject.dto.plan;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class DependencyResponse {

    private UUID id;
    private UUID dependsOnActionId;
    private String dependsOnActionName;
    private String dependencyType;
}
