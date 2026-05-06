package com.meteoproject.controller;

import com.meteoproject.dto.plan.*;
import com.meteoproject.service.PlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/plans")
@RequiredArgsConstructor
@Slf4j
public class PlanController {

    private final PlanService planService;

    @PostMapping("/actions")
    public ResponseEntity<ActionResponse> createAction(@Valid @RequestBody CreateActionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(planService.createAction(request));
    }

    @PutMapping("/actions/{id}")
    public ResponseEntity<ActionResponse> updateAction(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateActionRequest request) {
        return ResponseEntity.ok(planService.updateAction(id, request));
    }

    @GetMapping("/actions/{id}")
    public ResponseEntity<ActionResponse> getAction(@PathVariable UUID id) {
        return ResponseEntity.ok(planService.getAction(id));
    }

    @GetMapping("/modules/{moduleId}/actions")
    public ResponseEntity<List<ActionResponse>> getActionsByModule(@PathVariable UUID moduleId) {
        return ResponseEntity.ok(planService.getActionsByModule(moduleId));
    }

    @GetMapping("/projects/{projectId}/actions")
    public ResponseEntity<List<ActionResponse>> getActionsByProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(planService.getActionsByProject(projectId));
    }

    @DeleteMapping("/actions/{id}")
    public ResponseEntity<Void> deleteAction(@PathVariable UUID id) {
        planService.deleteAction(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/actions/{id}/dependencies")
    public ResponseEntity<DependencyResponse> addDependency(
            @PathVariable UUID id,
            @Valid @RequestBody DependencyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(planService.addDependency(id, request));
    }

    @DeleteMapping("/dependencies/{id}")
    public ResponseEntity<Void> removeDependency(@PathVariable UUID id) {
        planService.removeDependency(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/projects/{projectId}/progress")
    public ResponseEntity<ProgressSummary> getProjectProgress(@PathVariable UUID projectId) {
        return ResponseEntity.ok(planService.calculateProjectProgress(projectId));
    }
}
