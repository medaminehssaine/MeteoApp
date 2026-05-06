package com.meteoproject.controller;

import com.meteoproject.dto.cqd.CQDHistoryResponse;
import com.meteoproject.dto.cqd.CQDResponse;
import com.meteoproject.service.CQDCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cqd")
@RequiredArgsConstructor
public class CQDController {

    private final CQDCalculationService cqdCalculationService;

    @PostMapping("/projects/{projectId}/calculate")
    public ResponseEntity<CQDResponse> calculateCQD(@PathVariable UUID projectId) {
        return ResponseEntity.ok(cqdCalculationService.calculateCQD(projectId));
    }

    @GetMapping("/projects/{projectId}/current")
    public ResponseEntity<CQDResponse> getCurrentCQD(@PathVariable UUID projectId) {
        return ResponseEntity.ok(cqdCalculationService.getCurrentCQD(projectId));
    }

    @GetMapping("/projects/{projectId}/history")
    public ResponseEntity<Page<CQDHistoryResponse>> getCQDHistory(
            @PathVariable UUID projectId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(cqdCalculationService.getCQDHistory(projectId, pageable));
    }
}
