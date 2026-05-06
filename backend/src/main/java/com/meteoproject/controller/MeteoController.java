package com.meteoproject.controller;

import com.meteoproject.dto.meteo.MeteoHistoryResponse;
import com.meteoproject.dto.meteo.MeteoResponse;
import com.meteoproject.service.MeteoCalculationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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

    @Operation(summary = "Calculate project meteo", description = "Calculates and stores the current weather-style project health.")
    @ApiResponse(responseCode = "200", description = "Meteo calculated")
    @ApiResponse(responseCode = "404", description = "Project not found")
    @PostMapping("/projects/{projectId}/calculate")
    public ResponseEntity<MeteoResponse> calculateMeteo(@PathVariable UUID projectId) {
        return ResponseEntity.ok(meteoCalculationService.calculateMeteo(projectId));
    }

    @Operation(summary = "Get current project meteo", description = "Returns the latest stored meteo state or the default neutral state.")
    @ApiResponse(responseCode = "200", description = "Current meteo returned")
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
