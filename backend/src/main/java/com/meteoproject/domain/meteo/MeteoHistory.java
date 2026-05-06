package com.meteoproject.domain.meteo;

import com.meteoproject.domain.meteo.enums.MeteoState;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "meteo_history")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MeteoHistory {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "calculation_date", nullable = false)
    private LocalDate calculationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "meteo_state", nullable = false)
    private MeteoState meteoState;

    @Column(name = "calculated_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal calculatedScore;

    @Column(name = "raw_score", precision = 5, scale = 2)
    private BigDecimal rawScore;

    @Column(name = "was_forced", nullable = false)
    @Builder.Default
    private Boolean wasForced = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "active_forcing_rules", columnDefinition = "jsonb")
    private String activeForcingRules;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "indicator_scores", columnDefinition = "jsonb")
    private String indicatorScores;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "module_scores", columnDefinition = "jsonb")
    private String moduleScores;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "triggered_by", length = 50)
    @Builder.Default
    private String triggeredBy = "AUTO";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
