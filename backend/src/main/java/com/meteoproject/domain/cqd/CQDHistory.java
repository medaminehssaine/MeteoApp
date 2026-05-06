package com.meteoproject.domain.cqd;

import com.meteoproject.domain.cqd.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "cqd_history")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CQDHistory {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "calculation_date", nullable = false)
    private LocalDate calculationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "cost_state", nullable = false)
    private CQDState costState;

    @Column(name = "cost_variance_pct", precision = 8, scale = 2, nullable = false)
    private BigDecimal costVariancePct;

    @Column(name = "cost_budget_consumed", precision = 15, scale = 2)
    private BigDecimal costBudgetConsumed;

    @Column(name = "cost_budget_planned", precision = 15, scale = 2)
    private BigDecimal costBudgetPlanned;

    @Column(name = "cost_explanation", columnDefinition = "TEXT")
    private String costExplanation;

    @Enumerated(EnumType.STRING)
    @Column(name = "quality_state", nullable = false)
    private CQDState qualityState;

    @Column(name = "quality_score", nullable = false)
    private Integer qualityScore;

    @Column(name = "quality_explanation", columnDefinition = "TEXT")
    private String qualityExplanation;

    @Enumerated(EnumType.STRING)
    @Column(name = "delay_state", nullable = false)
    private CQDState delayState;

    @Column(name = "delay_variance_pct", precision = 8, scale = 2, nullable = false)
    private BigDecimal delayVariancePct;

    @Column(name = "delay_planned_progress", precision = 5, scale = 2)
    private BigDecimal delayPlannedProgress;

    @Column(name = "delay_actual_progress", precision = 5, scale = 2)
    private BigDecimal delayActualProgress;

    @Column(name = "delay_explanation", columnDefinition = "TEXT")
    private String delayExplanation;

    @Enumerated(EnumType.STRING)
    @Column(name = "cost_trend", nullable = false)
    @Builder.Default
    private Trend costTrend = Trend.STABLE;

    @Enumerated(EnumType.STRING)
    @Column(name = "quality_trend", nullable = false)
    @Builder.Default
    private Trend qualityTrend = Trend.STABLE;

    @Enumerated(EnumType.STRING)
    @Column(name = "delay_trend", nullable = false)
    @Builder.Default
    private Trend delayTrend = Trend.STABLE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
