package com.meteoproject.security.rbac;

import java.lang.annotation.*;

/**
 * Declares that the annotated method requires the caller to have a specific role
 * on the project identified by the first method parameter (projectId).
 *
 * Usage:
 *   @RequiresProjectRole({"CHEF", "MEMBER"})
 *   public SomeDto update(UUID projectId, ...) { ... }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequiresProjectRole {
    /** Allowed roles (e.g. "CHEF", "DIRECTOR", "MEMBER"). ADMIN always passes. */
    String[] value() default {};
}
