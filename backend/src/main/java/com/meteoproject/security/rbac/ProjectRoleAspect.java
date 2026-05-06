package com.meteoproject.security.rbac;

import com.meteoproject.exception.UnauthorizedException;
import com.meteoproject.repository.UserProjectRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.*;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class ProjectRoleAspect {

    private final UserProjectRoleRepository userProjectRoleRepo;

    @Around("@annotation(com.meteoproject.security.rbac.RequiresProjectRole)")
    public Object checkProjectRole(ProceedingJoinPoint pjp) throws Throwable {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("Authentication required");
        }

        // ADMIN always allowed
        boolean isAdmin = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
        if (isAdmin) return pjp.proceed();

        MethodSignature sig = (MethodSignature) pjp.getSignature();
        Method method = sig.getMethod();
        RequiresProjectRole annotation = method.getAnnotation(RequiresProjectRole.class);
        String[] requiredRoles = annotation.value();

        // First UUID argument is the projectId
        UUID projectId = Arrays.stream(pjp.getArgs())
                .filter(a -> a instanceof UUID)
                .map(a -> (UUID) a)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "@RequiresProjectRole method must have a UUID projectId as first arg"));

        UUID userId = (UUID) auth.getPrincipal();

        // Check user has the required role on this project
        // Convert required role strings to Role enum values
        List<com.meteoproject.domain.user.enums.Role> roleList = Arrays.stream(requiredRoles)
                .map(r -> {
                    try { return com.meteoproject.domain.user.enums.Role.valueOf(r); }
                    catch (IllegalArgumentException e) { return null; }
                })
                .filter(Objects::nonNull)
                .toList();

        boolean hasRole = roleList.isEmpty() || userProjectRoleRepo.hasAnyRole(userId, projectId, roleList);

        if (!hasRole) {
            log.warn("User {} does not have role {} on project {}", userId, Arrays.toString(requiredRoles), projectId);
            throw new UnauthorizedException("You do not have the required role for this project");
        }

        return pjp.proceed();
    }
}
