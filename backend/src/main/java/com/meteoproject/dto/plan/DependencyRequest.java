package com.meteoproject.dto.plan;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class DependencyRequest {

    @NotNull(message = "Depends-on action ID is required")
    private UUID dependsOnActionId;

    @NotBlank(message = "Dependency type is required")
    private String dependencyType;
}
