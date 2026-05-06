package com.meteoproject.domain.indicator;

import com.meteoproject.domain.indicator.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "indicator_library")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class IndicatorLibrary {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 20)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IndicatorCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Unit unit;

    @Column(name = "calculation_formula", columnDefinition = "TEXT")
    private String calculationFormula;

    @Column(name = "is_inverted", nullable = false)
    @Builder.Default
    private Boolean isInverted = false;

    @Column(name = "default_threshold_green", precision = 10, scale = 2, nullable = false)
    private BigDecimal defaultThresholdGreen;

    @Column(name = "default_threshold_orange", precision = 10, scale = 2, nullable = false)
    private BigDecimal defaultThresholdOrange;

    @Column(name = "default_threshold_red", precision = 10, scale = 2, nullable = false)
    private BigDecimal defaultThresholdRed;

    @Column(name = "default_weight", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal defaultWeight = BigDecimal.TEN;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
