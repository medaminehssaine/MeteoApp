package com.meteoproject.controller;

import com.meteoproject.service.ai.FileIngestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Smart File Ingestion endpoint.
 *
 * Accepts any file (CSV, Excel, PDF, text) and uses LLM
 * to extract structured project data automatically.
 */
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "AI", description = "AI-powered features (local Ollama LLM)")
public class FileIngestController {

    private final FileIngestService ingestService;

    /**
     * Full ingestion: parse file + LLM extraction.
     * Returns structured project data (indicators, risks, actions, etc.)
     */
    @PostMapping(value = "/ingest", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upload a file and extract structured project data via AI")
    public ResponseEntity<Map<String, Object>> ingestFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "projectName", required = false) String projectName) {

        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le fichier est vide"));
        }

        if (!ingestService.isSupportedType(file)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Format non supporté. Formats acceptés: CSV, Excel (.xlsx), PDF, texte (.txt, .md)",
                "receivedType", file.getContentType() != null ? file.getContentType() : "unknown"
            ));
        }

        // 10MB limit
        if (file.getSize() > 10 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le fichier dépasse la limite de 10 Mo"));
        }

        Map<String, Object> result = ingestService.ingest(file, projectName);
        return ResponseEntity.ok(result);
    }

    /**
     * Quick preview: parse file and show extracted text without LLM.
     * Used for "show me what you read" before running AI analysis.
     */
    @PostMapping(value = "/ingest/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Preview file content without AI analysis")
    public ResponseEntity<Map<String, Object>> previewFile(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le fichier est vide"));
        }

        return ResponseEntity.ok(ingestService.preview(file));
    }
}
