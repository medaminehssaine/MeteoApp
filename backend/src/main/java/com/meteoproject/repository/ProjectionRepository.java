package com.meteoproject.repository;

import com.meteoproject.domain.projection.Projection;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.*;

public interface ProjectionRepository extends JpaRepository<Projection, UUID> {
    @Query("SELECT p FROM Projection p WHERE p.projectId = :projectId AND p.horizonDays = :horizon ORDER BY p.projectionDate DESC")
    List<Projection> findLatest(@Param("projectId") UUID projectId, @Param("horizon") int horizon, Pageable pageable);

    Optional<Projection> findTopByProjectIdOrderByCreatedAtDesc(UUID projectId);

    org.springframework.data.domain.Page<Projection> findByProjectIdOrderByCreatedAtDesc(UUID projectId, Pageable pageable);

    @Query("SELECT p FROM Projection p WHERE p.targetDate = :date AND p.actualMeteo IS NULL")
    List<Projection> findMaturedProjections(@Param("date") LocalDate date);

    @Query("SELECT p FROM Projection p WHERE p.projectId = :projectId AND p.accuracyScore IS NOT NULL ORDER BY p.projectionDate DESC")
    List<Projection> findEvaluatedProjections(@Param("projectId") UUID projectId);
}
