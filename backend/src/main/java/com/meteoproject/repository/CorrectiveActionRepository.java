package com.meteoproject.repository;

import com.meteoproject.domain.corrective.CorrectiveAction;
import com.meteoproject.domain.corrective.enums.CorrectiveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface CorrectiveActionRepository extends JpaRepository<CorrectiveAction, UUID> {
    List<CorrectiveAction> findByProjectId(UUID projectId);
    List<CorrectiveAction> findByProjectIdAndStatus(UUID projectId, CorrectiveStatus status);
    List<CorrectiveAction> findByIndicatorId(UUID indicatorId);

    @Query("SELECT COUNT(ca) FROM CorrectiveAction ca WHERE ca.project.id = :projectId AND ca.status IN ('OPEN','IN_PROGRESS')")
    long countActiveByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(ca) FROM CorrectiveAction ca WHERE ca.project.id = :projectId AND ca.status = 'COMPLETED'")
    long countCompletedByProjectId(@Param("projectId") UUID projectId);

    List<CorrectiveAction> findByResponsibleId(UUID userId);

    @Query("SELECT ca FROM CorrectiveAction ca WHERE ca.project.id = :projectId AND ca.status IN ('OPEN','IN_PROGRESS') AND ca.deadline < CURRENT_DATE")
    List<CorrectiveAction> findOverdueByProjectId(@Param("projectId") UUID projectId);
}
