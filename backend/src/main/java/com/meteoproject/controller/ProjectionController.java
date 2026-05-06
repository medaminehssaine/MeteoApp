package com.meteoproject.controller;

import com.meteoproject.dto.projection.ProjectionHistoryResponse;
import com.meteoproject.dto.projection.ProjectionRequest;
import com.meteoproject.dto.projection.ProjectionResponse;
import com.meteoproject.service.ProjectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projections")
@RequiredArgsConstructor
public class ProjectionController {

    private final ProjectionService projectionService;

    @Operation(summary = "Generate a projection", description = "Generates a project projection for the requested horizon and scenario.")
    @ApiResponse(responseCode = "200", description = "Projection generated")
    @ApiResponse(responseCode = "400", description = "Invalid projection request")
    @ApiResponse(responseCode = "404", description = "Project not found")
    @PostMapping("/projects/{projectId}")
    public ResponseEntity<ProjectionResponse> generate(
            @PathVariable UUID projectId,
            @Valid @RequestBody ProjectionRequest request) {
        return ResponseEntity.ok(projectionService.generateProjection(projectId, request));
    }

    @GetMapping("/projects/{projectId}/latest")
    public ResponseEntity<ProjectionResponse> getLatest(@PathVariable UUID projectId) {
        return ResponseEntity.ok(projectionService.getLatestProjection(projectId));
    }

    @GetMapping("/projects/{projectId}/history")
    public ResponseEntity<Page<ProjectionHistoryResponse>> getHistory(
            @PathVariable UUID projectId, Pageable pageable) {
        return ResponseEntity.ok(projectionService.getProjectionHistory(projectId, pageable));
    }
}
