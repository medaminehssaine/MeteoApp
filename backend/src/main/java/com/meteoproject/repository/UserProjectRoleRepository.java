package com.meteoproject.repository;

import com.meteoproject.domain.user.UserProjectRole;
import com.meteoproject.domain.user.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface UserProjectRoleRepository extends JpaRepository<UserProjectRole, UUID> {
    @Query("SELECT upr FROM UserProjectRole upr WHERE upr.user.id = :userId AND upr.project.id = :projectId AND upr.removedAt IS NULL")
    List<UserProjectRole> findActiveRoles(@Param("userId") UUID userId, @Param("projectId") UUID projectId);

    @Query("SELECT CASE WHEN COUNT(upr) > 0 THEN true ELSE false END FROM UserProjectRole upr " +
           "WHERE upr.user.id = :userId AND upr.project.id = :projectId AND upr.role IN :roles AND upr.removedAt IS NULL")
    boolean hasAnyRole(@Param("userId") UUID userId, @Param("projectId") UUID projectId, @Param("roles") List<Role> roles);

    @Query("SELECT upr FROM UserProjectRole upr JOIN FETCH upr.user WHERE upr.project.id = :projectId AND upr.removedAt IS NULL")
    List<UserProjectRole> findByProjectIdActive(@Param("projectId") UUID projectId);

    @Query("SELECT DISTINCT upr.project.id FROM UserProjectRole upr WHERE upr.user.id = :userId AND upr.removedAt IS NULL")
    List<UUID> findProjectIdsByUserId(@Param("userId") UUID userId);

    long countByProjectIdAndRemovedAtIsNull(UUID projectId);
}
