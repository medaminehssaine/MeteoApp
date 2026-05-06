package com.meteoproject.dto.user;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserSummaryResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String role;
}
