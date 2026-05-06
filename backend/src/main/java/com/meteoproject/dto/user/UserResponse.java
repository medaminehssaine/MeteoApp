package com.meteoproject.dto.user;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String role;
    private Boolean active;
    private Instant lastLoginAt;
    private Instant createdAt;
}
