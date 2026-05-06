package com.meteoproject.dto.meteo;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class ForcingCheckResult {
    private boolean forced;
    private String forcedBy;
    private Map<String, Object> details;
}
