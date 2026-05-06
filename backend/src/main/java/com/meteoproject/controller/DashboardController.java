package com.meteoproject.controller;

import com.meteoproject.domain.project.enums.ProjectStatus;
import com.meteoproject.repository.ProjectRepository;
import com.meteoproject.repository.ProjectionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard summary endpoints")
public class DashboardController {

    private final ProjectRepository projectRepo;
    private final ProjectionRepository projectionRepo;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Dashboard KPIs")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("totalProjects",    projectRepo.count());
        kpis.put("activeProjects",   projectRepo.countByStatus(ProjectStatus.IN_PROGRESS));
        kpis.put("totalProjections", projectionRepo.count());
        kpis.put("criticalAlerts",   0L);

        return ResponseEntity.ok(kpis);
    }

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Global platform statistics")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalProjects",    projectRepo.count());
        stats.put("activeProjects",   projectRepo.countByStatus(ProjectStatus.IN_PROGRESS));
        stats.put("totalProjections", projectionRepo.count());
        return ResponseEntity.ok(stats);
    }
}

