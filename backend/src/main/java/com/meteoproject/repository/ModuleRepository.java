package com.meteoproject.repository;

import com.meteoproject.domain.plan.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.*;

public interface ModuleRepository extends JpaRepository<Module, UUID> {
    List<Module> findByProjectIdOrderByOrderIndexAsc(UUID projectId);

    @Query("SELECT COALESCE(SUM(m.weight), 0) FROM Module m WHERE m.project.id = :projectId")
    BigDecimal sumWeightByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(m.weight), 0) FROM Module m WHERE m.project.id = :projectId AND m.id != :excludeId")
    BigDecimal sumWeightExcluding(@Param("projectId") UUID projectId, @Param("excludeId") UUID excludeId);

    boolean existsByProjectIdAndName(UUID projectId, String name);
}
