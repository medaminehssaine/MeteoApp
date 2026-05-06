package com.meteoproject.controller;

import com.meteoproject.domain.corrective.enums.CorrectiveStatus;
import com.meteoproject.dto.corrective.*;
import com.meteoproject.service.CorrectiveActionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/corrective-actions")
@RequiredArgsConstructor
public class CorrectiveActionController {

    private final CorrectiveActionService correctiveActionService;

    @PostMapping("/projects/{projectId}")
    public ResponseEntity<CorrectiveResponse> createAction(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateCorrectiveRequest request,
            Authentication authentication) {
        UUID createdById = (UUID) authentication.getPrincipal();
        CorrectiveResponse response = correctiveActionService.createAction(projectId, createdById, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CorrectiveResponse> updateAction(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCorrectiveRequest request) {
        return ResponseEntity.ok(correctiveActionService.updateAction(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CorrectiveResponse> getAction(@PathVariable UUID id) {
        return ResponseEntity.ok(correctiveActionService.getAction(id));
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<List<CorrectiveResponse>> getProjectActions(
            @PathVariable UUID projectId,
            @RequestParam(required = false) CorrectiveStatus status) {
        return ResponseEntity.ok(correctiveActionService.getProjectActions(projectId, status));
    }

    @GetMapping("/my")
    public ResponseEntity<List<CorrectiveResponse>> getMyActions(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(correctiveActionService.getMyActions(userId));
    }

    @GetMapping("/projects/{projectId}/overdue")
    public ResponseEntity<List<CorrectiveResponse>> getOverdueActions(@PathVariable UUID projectId) {
        return ResponseEntity.ok(correctiveActionService.getOverdueActions(projectId));
    }
}
