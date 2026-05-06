package com.meteoproject.dto.risk;

import com.meteoproject.domain.risk.enums.RiskCategory;
import com.meteoproject.domain.risk.enums.RiskStatus;
import lombok.Builder;
import lombok.Data;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class RiskSummary {

    private UUID projectId;
    private long totalRisks;
    private long activeRisks;
    private double averageSeverity;
    private Map<RiskCategory, Integer> risksByCategory;
    private Map<RiskStatus, Integer> risksByStatus;
    private double mitigationCoverage;
}
