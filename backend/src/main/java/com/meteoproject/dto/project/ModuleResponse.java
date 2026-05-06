package com.meteoproject.dto.project;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ModuleResponse {
    private UUID id;
    private String name;
    private String description;
    private BigDecimal weight;
    private Integer orderIndex;
}
