package com.meteoproject.domain.plan;

import com.meteoproject.domain.plan.enums.*;
import com.meteoproject.domain.project.Project;
import com.meteoproject.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Entity
@Table(name = "actions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Action {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "planned_start", nullable = false)
    private LocalDate plannedStart;

    @Column(name = "actual_start")
    private LocalDate actualStart;

    @Column(name = "planned_end", nullable = false)
    private LocalDate plannedEnd;

    @Column(name = "actual_end")
    private LocalDate actualEnd;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ActionStatus status = ActionStatus.NOT_STARTED;

    @Column(nullable = false)
    @Builder.Default
    private Integer progress = 0;

    @Column(name = "blocking_reason", columnDefinition = "TEXT")
    private String blockingReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "blocking_type")
    private BlockingType blockingType;

    @Column(name = "blocked_since")
    private LocalDate blockedSince;

    @Column(name = "is_milestone", nullable = false)
    @Builder.Default
    private Boolean isMilestone = false;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    @OneToMany(mappedBy = "sourceAction", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ActionDependency> dependencies = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public boolean isLate() {
        return status != ActionStatus.COMPLETED && plannedEnd != null && LocalDate.now().isAfter(plannedEnd);
    }

    public int getRemainingDays() {
        return Math.max((int)(durationDays * (100 - progress) / 100.0), 0);
    }

    public long getBlockedDays() {
        if (status != ActionStatus.BLOCKED || blockedSince == null) return 0;
        return ChronoUnit.DAYS.between(blockedSince, LocalDate.now());
    }
}
