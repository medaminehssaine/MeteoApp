package com.meteoproject.dto.indicator;

import com.meteoproject.domain.indicator.enums.IndicatorCategory;
import com.meteoproject.domain.indicator.enums.Unit;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class IndicatorLibraryResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private IndicatorCategory category;
    private Unit unit;
    private Boolean isInverted;
    private String defaultFrequency;
    private String defaultCriticality;
}
