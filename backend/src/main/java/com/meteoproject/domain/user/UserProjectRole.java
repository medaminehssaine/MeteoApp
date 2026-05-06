package com.meteoproject.domain.user;

import com.meteoproject.domain.user.enums.Role;
import com.meteoproject.domain.project.Project;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "user_project_roles")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProjectRole {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "assigned_at", nullable = false)
    @Builder.Default
    private LocalDate assignedAt = LocalDate.now();

    @Column(name = "removed_at")
    private LocalDate removedAt;

    public boolean isActive() {
        return removedAt == null;
    }
}
