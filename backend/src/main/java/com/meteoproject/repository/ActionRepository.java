package com.meteoproject.repository;

import com.meteoproject.domain.plan.Action;
import com.meteoproject.domain.plan.enums.ActionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.*;

public interface ActionRepository extends JpaRepository<Action, UUID> {
    List<Action> findByProjectIdOrderByOrderIndexAsc(UUID projectId);
    List<Action> findByModuleIdOrderByOrderIndexAsc(UUID moduleId);
    Page<Action> findByProjectId(UUID projectId, Pageable pageable);

    @Query("SELECT a FROM Action a WHERE a.project.id = :projectId AND a.status = :status")
    List<Action> findByProjectIdAndStatus(@Param("projectId") UUID projectId, @Param("status") ActionStatus status);

    @Query("SELECT COUNT(a) FROM Action a WHERE a.project.id = :projectId AND a.status = 'BLOCKED' AND a.blockedSince <= :cutoff")
    long countBlockedOverDays(@Param("projectId") UUID projectId, @Param("cutoff") LocalDate cutoff);

    @Query("SELECT COUNT(a) FROM Action a WHERE a.project.id = :projectId")
    long countByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(a) FROM Action a WHERE a.project.id = :projectId AND a.status != 'COMPLETED' AND a.plannedEnd < CURRENT_DATE")
    long countLateActions(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(a) FROM Action a WHERE a.project.id = :projectId AND a.status = 'COMPLETED'")
    long countCompletedActions(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(a) FROM Action a WHERE a.project.id = :projectId AND a.status = 'BLOCKED'")
    long countBlockedActions(@Param("projectId") UUID projectId);

    @Query("SELECT a FROM Action a WHERE a.project.id = :projectId AND a.status != 'COMPLETED'")
    List<Action> findIncompleteActions(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(a.durationDays * a.progress), 0) FROM Action a WHERE a.project.id = :projectId")
    long sumWeightedProgress(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(a.durationDays), 0) FROM Action a WHERE a.project.id = :projectId")
    long sumDurationDays(@Param("projectId") UUID projectId);
}
