package com.meteoproject.controller;

import com.meteoproject.domain.indicator.enums.IndicatorCategory;
import com.meteoproject.dto.indicator.*;
import com.meteoproject.service.indicator.IndicatorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/indicators")
@RequiredArgsConstructor
public class IndicatorController {

    private final IndicatorService indicatorService;

    /**
     * GET /api/v1/indicators/library?category=QUALITY
     * Get the indicator library, optionally filtered by category.
     */
    @GetMapping("/library")
    public ResponseEntity<List<IndicatorLibraryResponse>> getLibrary(
            @RequestParam(required = false) IndicatorCategory category) {
        return ResponseEntity.ok(indicatorService.getLibrary(category));
    }

    /**
     * POST /api/v1/indicators/projects/{projectId}
     * Assign an indicator to a project.
     */
    @PostMapping("/projects/{projectId}")
    public ResponseEntity<ProjectIndicatorResponse> assignIndicator(
            @PathVariable UUID projectId,
            @Valid @RequestBody AssignIndicatorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(indicatorService.assignIndicator(projectId, request));
    }

    /**
     * GET /api/v1/indicators/projects/{projectId}
     * Get all active indicators for a project.
     */
    @GetMapping("/projects/{projectId}")
    public ResponseEntity<List<ProjectIndicatorResponse>> getProjectIndicators(
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(indicatorService.getProjectIndicators(projectId));
    }

    /**
     * PUT /api/v1/indicators/{projectIndicatorId}/value
     * Update the current value of a project indicator.
     */
    @PutMapping("/{projectIndicatorId}/value")
    public ResponseEntity<ProjectIndicatorResponse> updateIndicatorValue(
            @PathVariable UUID projectIndicatorId,
            Authentication authentication,
            @Valid @RequestBody UpdateIndicatorValueRequest request) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(
                indicatorService.updateIndicatorValue(projectIndicatorId, userId, request));
    }

    /**
     * GET /api/v1/indicators/{projectIndicatorId}/history?page=0&size=20
     * Get paginated history for a project indicator.
     */
    @GetMapping("/{projectIndicatorId}/history")
    public ResponseEntity<List<IndicatorHistoryResponse>> getIndicatorHistory(
            @PathVariable UUID projectIndicatorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(indicatorService.getIndicatorHistory(projectIndicatorId, pageable));
    }

    /**
     * GET /api/v1/indicators/projects/{projectId}/score
     * Get the global score summary for a project.
     */
    @GetMapping("/projects/{projectId}/score")
    public ResponseEntity<IndicatorScoreSummary> getGlobalScore(
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(indicatorService.calculateGlobalScore(projectId));
    }
}
