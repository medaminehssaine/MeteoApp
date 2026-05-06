package com.meteoproject.controller;

import com.meteoproject.dto.project.*;
import com.meteoproject.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectService projectService;

    @Operation(summary = "Create a project", description = "Creates a project owned by the authenticated user.")
    @ApiResponse(responseCode = "201", description = "Project created")
    @ApiResponse(responseCode = "400", description = "Invalid project request")
    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            Authentication authentication,
            @Valid @RequestBody CreateProjectRequest request) {
        UUID userId = (UUID) authentication.getPrincipal();
        ProjectResponse response = projectService.createProject(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @Operation(summary = "Get a project", description = "Returns full details for one project.")
    @ApiResponse(responseCode = "200", description = "Project found")
    @ApiResponse(responseCode = "404", description = "Project not found")
    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable UUID id) {
        return ResponseEntity.ok(projectService.getProject(id));
    }

    @Operation(summary = "List projects", description = "Returns paginated projects visible to the authenticated user.")
    @ApiResponse(responseCode = "200", description = "Projects returned")
    @GetMapping
    public ResponseEntity<Page<ProjectSummaryResponse>> listProjects(
            Authentication authentication,
            Pageable pageable) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(projectService.listUserProjects(userId, pageable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/modules")
    public ResponseEntity<ModuleResponse> addModule(
            @PathVariable UUID id,
            @Valid @RequestBody ModuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.addModule(id, request));
    }

    @GetMapping("/{id}/modules")
    public ResponseEntity<List<ModuleResponse>> getModules(@PathVariable UUID id) {
        return ResponseEntity.ok(projectService.getModules(id));
    }

    @DeleteMapping("/modules/{moduleId}")
    public ResponseEntity<Void> deleteModule(@PathVariable UUID moduleId) {
        projectService.deleteModule(moduleId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/team")
    public ResponseEntity<TeamMemberResponse> addTeamMember(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody AssignRoleRequest request) {
        UUID assignedById = (UUID) authentication.getPrincipal();
        TeamMemberResponse response = projectService.addTeamMember(
                id, request.getUserId(), request.getRole(), assignedById);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}/team/{userId}")
    public ResponseEntity<Void> removeTeamMember(
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        projectService.removeTeamMember(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/team")
    public ResponseEntity<List<TeamMemberResponse>> getTeamMembers(@PathVariable UUID id) {
        return ResponseEntity.ok(projectService.getTeamMembers(id));
    }
}
