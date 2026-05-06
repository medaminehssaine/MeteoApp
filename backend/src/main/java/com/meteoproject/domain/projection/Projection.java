package com.meteoproject.domain.projection;

import com.meteoproject.domain.cqd.enums.CQDState;
import com.meteoproject.domain.meteo.enums.MeteoState;
import com.meteoproject.domain.projection.enums.ConfidenceLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "projections")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Projection {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "projection_date", nullable = false)
    @Builder.Default
    private LocalDate projectionDate = LocalDate.now();

    @Column(name = "horizon_days", nullable = false)
    private Integer horizonDays;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "projected_meteo", nullable = false)
    private MeteoState projectedMeteo;

    @Column(name = "projected_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal projectedScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "confidence_level", nullable = false)
    private ConfidenceLevel confidenceLevel;

    @Column(name = "confidence_pct", precision = 5, scale = 2, nullable = false)
    private BigDecimal confidencePct;

    @Column(name = "trend_score", precision = 5, scale = 2)
    private BigDecimal trendScore;

    @Column(name = "simulation_score", precision = 5, scale = 2)
    private BigDecimal simulationScore;

    @Column(name = "action_plan_score", precision = 5, scale = 2)
    private BigDecimal actionPlanScore;

    @Column(name = "risk_score", precision = 5, scale = 2)
    private BigDecimal riskScore;

    @Column(name = "capacity_score", precision = 5, scale = 2)
    private BigDecimal capacityScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "projected_cost_state")
    private CQDState projectedCostState;

    @Enumerated(EnumType.STRING)
    @Column(name = "projected_quality_state")
    private CQDState projectedQualityState;

    @Enumerated(EnumType.STRING)
    @Column(name = "projected_delay_state")
    private CQDState projectedDelayState;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "projected_indicators", columnDefinition = "jsonb")
    private String projectedIndicators;

    @Column(columnDefinition = "TEXT")
    private String assumptions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "key_factors", columnDefinition = "jsonb")
    private String keyFactors;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String scenarios;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String recommendations;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Enumerated(EnumType.STRING)
    @Column(name = "actual_meteo")
    private MeteoState actualMeteo;

    @Column(name = "actual_score", precision = 5, scale = 2)
    private BigDecimal actualScore;

    @Column(name = "accuracy_score", precision = 5, scale = 2)
    private BigDecimal accuracyScore;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
