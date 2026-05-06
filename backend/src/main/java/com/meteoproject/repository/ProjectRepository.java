package com.meteoproject.repository;

import com.meteoproject.domain.project.Project;
import com.meteoproject.domain.project.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    boolean existsByName(String name);
    boolean existsByCode(String code);

    @Query("SELECT p FROM Project p WHERE p.id IN :ids AND p.status NOT IN ('ARCHIVED','CANCELLED')")
    Page<Project> findByIdInAndActive(@Param("ids") List<UUID> ids, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE p.status NOT IN ('ARCHIVED','CANCELLED')")
    Page<Project> findAllActive(Pageable pageable);

    @Query("SELECT COUNT(p) FROM Project p WHERE p.status = :status")
    long countByStatus(@Param("status") ProjectStatus status);

    @Query("SELECT p FROM Project p WHERE p.status = :status")
    Page<Project> findByStatus(@Param("status") ProjectStatus status, Pageable pageable);

    Optional<Project> findByCode(String code);
}
