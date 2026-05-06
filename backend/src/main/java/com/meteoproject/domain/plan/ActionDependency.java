package com.meteoproject.domain.plan;

import com.meteoproject.domain.plan.enums.DependencyType;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "action_dependencies")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ActionDependency {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_action_id", nullable = false)
    private Action sourceAction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_action_id", nullable = false)
    private Action targetAction;

    @Enumerated(EnumType.STRING)
    @Column(name = "dependency_type", nullable = false)
    @Builder.Default
    private DependencyType dependencyType = DependencyType.FINISH_TO_START;

    @Column(name = "lag_days", nullable = false)
    @Builder.Default
    private Integer lagDays = 0;
}
