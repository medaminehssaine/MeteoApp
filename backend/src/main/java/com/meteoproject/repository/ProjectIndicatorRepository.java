package com.meteoproject.repository;

import com.meteoproject.domain.indicator.ProjectIndicator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface ProjectIndicatorRepository extends JpaRepository<ProjectIndicator, UUID> {
    List<ProjectIndicator> findByProjectIdAndIsActiveTrue(UUID projectId);
    List<ProjectIndicator> findByProjectId(UUID projectId);

    @Query("SELECT pi FROM ProjectIndicator pi JOIN pi.indicatorLibrary il " +
           "WHERE pi.project.id = :projectId AND pi.isActive = true AND il.category = 'QUALITY'")
    List<ProjectIndicator> findActiveQualityIndicators(@Param("projectId") UUID projectId);

    @Query("SELECT pi FROM ProjectIndicator pi WHERE pi.project.id = :projectId AND pi.currentScore IS NOT NULL AND pi.currentScore < 20 " +
           "AND NOT EXISTS (SELECT ca FROM com.meteoproject.domain.corrective.CorrectiveAction ca " +
           "WHERE ca.indicator.id = pi.id AND ca.status IN ('OPEN','IN_PROGRESS'))")
    List<ProjectIndicator> findCriticalWithoutAction(@Param("projectId") UUID projectId);

    boolean existsByProjectIdAndIndicatorLibraryId(UUID projectId, UUID indicatorLibraryId);
}
