package com.meteoproject.domain.indicator;

import com.meteoproject.domain.indicator.enums.*;
import com.meteoproject.domain.project.Project;
import com.meteoproject.domain.project.enums.Criticality;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "project_indicators")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProjectIndicator {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indicator_library_id", nullable = false)
    private IndicatorLibrary indicatorLibrary;

    @Column(name = "threshold_green", precision = 10, scale = 2, nullable = false)
    private BigDecimal thresholdGreen;

    @Column(name = "threshold_orange", precision = 10, scale = 2, nullable = false)
    private BigDecimal thresholdOrange;

    @Column(name = "threshold_red", precision = 10, scale = 2, nullable = false)
    private BigDecimal thresholdRed;

    @Column(precision = 5, scale = 2, nullable = false)
    private BigDecimal weight;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Criticality criticality = Criticality.MEDIUM;

    @Column(name = "criticality_coefficient", precision = 3, scale = 1, nullable = false)
    @Builder.Default
    private BigDecimal criticalityCoefficient = BigDecimal.ONE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Frequency frequency = Frequency.WEEKLY;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "current_value", precision = 10, scale = 2)
    private BigDecimal currentValue;

    @Column(name = "current_score")
    private Integer currentScore;

    @Column(name = "last_measured_at")
    private LocalDate lastMeasuredAt;

    @OneToMany(mappedBy = "projectIndicator", cascade = CascadeType.ALL)
    @OrderBy("measuredAt DESC")
    @Builder.Default
    private List<IndicatorValueHistory> history = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
