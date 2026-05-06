package com.meteoproject.domain.risk;

import com.meteoproject.domain.risk.enums.*;
import com.meteoproject.domain.project.Project;
import com.meteoproject.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "risks")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Risk {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskCategory category;

    @Column(nullable = false)
    private Integer probability;

    @Column(nullable = false)
    private Integer impact;

    @Column(nullable = false)
    @Builder.Default
    private Integer severity = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RiskStatus status = RiskStatus.IDENTIFIED;

    @Column(name = "mitigation_plan", columnDefinition = "TEXT")
    private String mitigationPlan;

    @Column(name = "contingency_plan", columnDefinition = "TEXT")
    private String contingencyPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(name = "identified_at", nullable = false)
    @Builder.Default
    private LocalDate identifiedAt = LocalDate.now();

    @Column(name = "review_date")
    private LocalDate reviewDate;

    @Column(name = "materialized_at")
    private LocalDate materializedAt;

    @Column(name = "closed_at")
    private LocalDate closedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist @PreUpdate
    public void calculateSeverity() {
        this.severity = (probability * impact) / 100;
    }
}
