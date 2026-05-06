package com.meteoproject.controller;

import com.meteoproject.domain.risk.enums.RiskStatus;
import com.meteoproject.dto.risk.*;
import com.meteoproject.service.RiskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/risks")
@RequiredArgsConstructor
public class RiskController {

    private final RiskService riskService;

    @PostMapping("/projects/{projectId}")
    public ResponseEntity<RiskResponse> createRisk(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateRiskRequest request) {
        RiskResponse response = riskService.createRisk(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RiskResponse> updateRisk(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRiskRequest request) {
        return ResponseEntity.ok(riskService.updateRisk(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RiskResponse> getRisk(@PathVariable UUID id) {
        return ResponseEntity.ok(riskService.getRisk(id));
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<List<RiskResponse>> getProjectRisks(
            @PathVariable UUID projectId,
            @RequestParam(required = false) RiskStatus status) {
        return ResponseEntity.ok(riskService.getProjectRisks(projectId, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRisk(@PathVariable UUID id) {
        riskService.deleteRisk(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/projects/{projectId}/summary")
    public ResponseEntity<RiskSummary> getRiskSummary(@PathVariable UUID projectId) {
        return ResponseEntity.ok(riskService.getRiskSummary(projectId));
    }
}
