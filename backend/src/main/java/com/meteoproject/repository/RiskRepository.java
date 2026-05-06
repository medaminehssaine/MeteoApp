package com.meteoproject.repository;

import com.meteoproject.domain.risk.Risk;
import com.meteoproject.domain.risk.enums.RiskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface RiskRepository extends JpaRepository<Risk, UUID> {
    List<Risk> findByProjectId(UUID projectId);
    List<Risk> findByProjectIdAndStatus(UUID projectId, RiskStatus status);

    @Query("SELECT r FROM Risk r WHERE r.project.id = :projectId AND r.status NOT IN ('CLOSED')")
    List<Risk> findActiveRisks(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(r) FROM Risk r WHERE r.project.id = :projectId AND r.status = 'MATERIALIZED'")
    long countMaterialized(@Param("projectId") UUID projectId);

    @Query("SELECT AVG(r.severity) FROM Risk r WHERE r.project.id = :projectId AND r.status NOT IN ('CLOSED')")
    Double averageSeverity(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(r) FROM Risk r WHERE r.project.id = :projectId AND r.status NOT IN ('CLOSED') AND r.mitigationPlan IS NOT NULL AND r.mitigationPlan != ''")
    long countWithMitigation(@Param("projectId") UUID projectId);
}
