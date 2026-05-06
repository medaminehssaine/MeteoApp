package com.meteoproject.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AssignRoleRequest {
    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotBlank(message = "Role is required")
    private String role;
}
