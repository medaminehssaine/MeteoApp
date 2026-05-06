package com.meteoproject.controller;

import com.meteoproject.dto.meteo.MeteoHistoryResponse;
import com.meteoproject.dto.meteo.MeteoResponse;
import com.meteoproject.service.MeteoCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/meteo")
@RequiredArgsConstructor
public class MeteoController {

    private final MeteoCalculationService meteoCalculationService;

    @PostMapping("/projects/{projectId}/calculate")
    public ResponseEntity<MeteoResponse> calculateMeteo(@PathVariable UUID projectId) {
        return ResponseEntity.ok(meteoCalculationService.calculateMeteo(projectId));
    }

    @GetMapping("/projects/{projectId}/current")
    public ResponseEntity<MeteoResponse> getCurrentMeteo(@PathVariable UUID projectId) {
        return ResponseEntity.ok(meteoCalculationService.getCurrentMeteo(projectId));
    }

    @GetMapping("/projects/{projectId}/history")
    public ResponseEntity<Page<MeteoHistoryResponse>> getMeteoHistory(
            @PathVariable UUID projectId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(meteoCalculationService.getMeteoHistory(projectId, pageable));
    }
}
