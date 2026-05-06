package com.meteoproject.domain.corrective;

import com.meteoproject.domain.corrective.enums.*;
import com.meteoproject.domain.indicator.ProjectIndicator;
import com.meteoproject.domain.plan.Action;
import com.meteoproject.domain.project.Project;
import com.meteoproject.domain.risk.Risk;
import com.meteoproject.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "corrective_actions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CorrectiveAction {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indicator_id")
    private ProjectIndicator indicator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_action_id")
    private Action blockedAction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "risk_id")
    private Risk risk;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;

    @Column(nullable = false)
    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CorrectiveStatus status = CorrectiveStatus.OPEN;

    @Column(name = "expected_impact", columnDefinition = "TEXT")
    private String expectedImpact;

    @Column(name = "actual_impact", columnDefinition = "TEXT")
    private String actualImpact;

    @Column(name = "completed_at")
    private LocalDate completedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public boolean isOverdue() {
        return (status == CorrectiveStatus.OPEN || status == CorrectiveStatus.IN_PROGRESS)
            && LocalDate.now().isAfter(deadline);
    }
}
