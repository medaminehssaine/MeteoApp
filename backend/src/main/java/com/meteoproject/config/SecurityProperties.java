package com.meteoproject.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {
    private int maxFailedAttempts = 5;
    private int lockDurationMinutes = 30;
    private int bcryptStrength = 12;
}
