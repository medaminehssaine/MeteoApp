package com.meteoproject.controller;

import com.meteoproject.service.ai.AIProjectService;
import com.meteoproject.service.ai.AIProjectService.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "AI", description = "AI-powered features (local Ollama LLM)")
public class AIController {

    private final AIProjectService aiService;

    // ── 1. Natural Language Input → Structured Data ─────────────────
    @PostMapping("/extract")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Extract structured project data from natural language description")
    public ResponseEntity<Map<String, Object>> extract(@Valid @RequestBody NLRequest req) {
        return ResponseEntity.ok(aiService.extractFromNaturalLanguage(req.projectName(), req.text()));
    }

    // ── 2. Météo Explanation ────────────────────────────────────────
    @PostMapping("/explain-meteo")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Generate a human-readable explanation for a météo score")
    public ResponseEntity<Map<String, String>> explainMeteo(@RequestBody MeteoContext ctx) {
        String explanation = aiService.explainMeteo(ctx);
        return ResponseEntity.ok(Map.of("explanation", explanation));
    }

    // ── 3. Enrich Projection ────────────────────────────────────────
    @PostMapping("/enrich-projection")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Add AI narrative and recommendations to a Monte Carlo projection")
    public ResponseEntity<Map<String, Object>> enrichProjection(@RequestBody ProjectionContext ctx) {
        return ResponseEntity.ok(aiService.enrichProjection(ctx));
    }

    // ── 4. Smart Recommendations ────────────────────────────────────
    @PostMapping("/recommendations")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Generate AI-powered project recommendations")
    public ResponseEntity<Map<String, Object>> recommendations(@RequestBody RecommendationContext ctx) {
        return ResponseEntity.ok(aiService.generateRecommendations(ctx));
    }

    // ── Request DTOs ────────────────────────────────────────────────
    record NLRequest(
        @NotBlank String projectName,
        @NotBlank @Size(min = 10, max = 5000) String text
    ) {}
}
