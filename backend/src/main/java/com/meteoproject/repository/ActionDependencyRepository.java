package com.meteoproject.repository;

import com.meteoproject.domain.plan.ActionDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface ActionDependencyRepository extends JpaRepository<ActionDependency, UUID> {
    List<ActionDependency> findBySourceActionId(UUID sourceActionId);
    List<ActionDependency> findByTargetActionId(UUID targetActionId);
    boolean existsBySourceActionIdAndTargetActionId(UUID sourceId, UUID targetId);
}
