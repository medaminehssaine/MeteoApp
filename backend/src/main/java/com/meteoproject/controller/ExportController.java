package com.meteoproject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/exports")
@RequiredArgsConstructor
@Tag(name = "Exports", description = "PDF and Excel export endpoints")
public class ExportController {

    @PostMapping("/pdf")
    @Operation(summary = "Export project report as PDF")
    public ResponseEntity<byte[]> exportPdf(@RequestBody Map<String, Object> request) {
        // Stub — returns minimal PDF placeholder bytes
        // In production, inject PdfExportService and call it here
        String projectId = (String) request.get("projectId");
        byte[] pdfBytes = generatePlaceholderPdf(projectId);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"rapport-projet.pdf\"")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdfBytes);
    }

    @PostMapping("/excel")
    @Operation(summary = "Export project data as Excel")
    public ResponseEntity<byte[]> exportExcel(@RequestBody Map<String, Object> request) {
        // Stub — returns empty bytes
        String projectId = (String) request.get("projectId");
        byte[] xlsxBytes = new byte[0];

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"export-projet.xlsx\"")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(xlsxBytes);
    }

    private byte[] generatePlaceholderPdf(String projectId) {
        // Minimal valid PDF-like stub
        String content = "%PDF-1.4\nMeteo Projet Export - Project: " + projectId + "\n%%EOF";
        return content.getBytes();
    }
}
