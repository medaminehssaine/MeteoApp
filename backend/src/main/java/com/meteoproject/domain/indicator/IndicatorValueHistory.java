package com.meteoproject.domain.indicator;

import com.meteoproject.domain.indicator.enums.IndicatorState;
import com.meteoproject.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "indicator_value_history")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class IndicatorValueHistory {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_indicator_id", nullable = false)
    private ProjectIndicator projectIndicator;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal value;

    @Column(nullable = false)
    private Integer score;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IndicatorState state;

    @Column(name = "measured_at", nullable = false)
    private LocalDate measuredAt;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by", nullable = false)
    private User recordedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
