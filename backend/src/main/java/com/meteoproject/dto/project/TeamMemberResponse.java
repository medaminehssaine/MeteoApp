package com.meteoproject.dto.project;

import com.meteoproject.domain.user.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class TeamMemberResponse {
    private UUID userId;
    private String fullName;
    private String email;
    private Role role;
    private LocalDate assignedAt;
}
