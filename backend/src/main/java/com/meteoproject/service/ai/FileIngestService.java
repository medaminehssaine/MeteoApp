package com.meteoproject.service.ai;

import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Smart File Ingestion Pipeline.
 *
 * Accepts any file format (CSV, Excel, PDF, plain text),
 * extracts text content, then feeds it to the LLM for
 * intelligent project data extraction.
 *
 * Flow: File → Parse → Raw Text → LLM → Structured JSON
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FileIngestService {

    private final GroqService ai;

    // Max text length sent to LLM (avoid token overflow)
    private static final int MAX_TEXT_LENGTH = 12_000;

    // Supported MIME types
    private static final Set<String> SUPPORTED_TYPES = Set.of(
        "text/csv",
        "text/plain",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel"
    );

    // ───────────────────────────────────────────────────────
    // Public API
    // ───────────────────────────────────────────────────────

    /**
     * Ingest a file and extract structured project data.
     *
     * @param file        uploaded file (CSV, Excel, PDF, or text)
     * @param projectName optional project name to contextualize the extraction
     * @return structured extraction result from LLM
     */
    public Map<String, Object> ingest(MultipartFile file, String projectName) {
        String fileName = file.getOriginalFilename();
        log.info("Ingesting file: {} ({}, {} bytes)", fileName, file.getContentType(), file.getSize());

        // 1. Extract raw text from the file
        String rawText = extractText(file);
        if (rawText.isBlank()) {
            return Map.of(
                "error", "Impossible de lire le contenu du fichier",
                "fileName", fileName != null ? fileName : "unknown"
            );
        }

        // 2. Truncate if too long
        if (rawText.length() > MAX_TEXT_LENGTH) {
            log.warn("File content truncated from {} to {} chars", rawText.length(), MAX_TEXT_LENGTH);
            rawText = rawText.substring(0, MAX_TEXT_LENGTH) + "\n\n[... contenu tronqué ...]";
        }

        // 3. Build extraction prompt & call LLM
        String prompt = buildExtractionPrompt(rawText, projectName, fileName);
        Map<String, Object> result = ai.generateJson(prompt);

        // 4. Attach file metadata
        result.put("_source", Map.of(
            "fileName", fileName != null ? fileName : "unknown",
            "fileSize", file.getSize(),
            "fileType", detectFileType(file),
            "extractedChars", rawText.length()
        ));

        return result;
    }

    /**
     * Quick preview — just extract the raw text without LLM analysis.
     * Used for showing the user what was parsed before running AI.
     */
    public Map<String, Object> preview(MultipartFile file) {
        String rawText = extractText(file);
        String type = detectFileType(file);
        return Map.of(
            "fileName", file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown",
            "fileType", type,
            "fileSize", file.getSize(),
            "extractedChars", rawText.length(),
            "preview", rawText.length() > 2000 ? rawText.substring(0, 2000) + "..." : rawText,
            "supported", !rawText.isBlank()
        );
    }

    public boolean isSupportedType(MultipartFile file) {
        String contentType = file.getContentType();
        String fileName = file.getOriginalFilename();
        if (contentType != null && SUPPORTED_TYPES.contains(contentType)) return true;
        if (fileName != null) {
            String lower = fileName.toLowerCase();
            return lower.endsWith(".csv") || lower.endsWith(".xlsx") || lower.endsWith(".xls")
                || lower.endsWith(".pdf") || lower.endsWith(".txt") || lower.endsWith(".md");
        }
        return false;
    }

    // ───────────────────────────────────────────────────────
    // File Parsers
    // ───────────────────────────────────────────────────────

    private String extractText(MultipartFile file) {
        String type = detectFileType(file);
        try {
            return switch (type) {
                case "csv"   -> extractFromCsv(file);
                case "excel" -> extractFromExcel(file);
                case "pdf"   -> extractFromPdf(file);
                case "text"  -> extractFromText(file);
                default      -> "";
            };
        } catch (Exception e) {
            log.error("Failed to extract text from file: {}", e.getMessage());
            return "";
        }
    }

    private String detectFileType(MultipartFile file) {
        String name = file.getOriginalFilename();
        String mime = file.getContentType();

        if (name != null) {
            String lower = name.toLowerCase();
            if (lower.endsWith(".csv")) return "csv";
            if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "excel";
            if (lower.endsWith(".pdf")) return "pdf";
            if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text";
        }

        if (mime != null) {
            if (mime.contains("csv")) return "csv";
            if (mime.contains("spreadsheet") || mime.contains("excel")) return "excel";
            if (mime.contains("pdf")) return "pdf";
        }

        return "text"; // fallback: try as plain text
    }

    /** CSV → tabular text representation */
    private String extractFromCsv(MultipartFile file) throws Exception {
        StringBuilder sb = new StringBuilder();
        sb.append("=== DONNÉES CSV ===\n\n");

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String[] headers = reader.readNext();
            if (headers != null) {
                sb.append("Colonnes: ").append(String.join(" | ", headers)).append("\n");
                sb.append("-".repeat(60)).append("\n");
            }

            String[] row;
            int rowNum = 0;
            while ((row = reader.readNext()) != null && rowNum < 500) {
                sb.append(String.join(" | ", row)).append("\n");
                rowNum++;
            }

            if (rowNum >= 500) {
                sb.append("\n[... ").append(rowNum).append(" lignes affichées sur un total potentiellement plus grand ...]\n");
            }
        }

        return sb.toString();
    }

    /** Excel → tabular text representation (all sheets) */
    private String extractFromExcel(MultipartFile file) throws Exception {
        StringBuilder sb = new StringBuilder();
        sb.append("=== DONNÉES EXCEL ===\n\n");

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            DataFormatter formatter = new DataFormatter();

            for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                Sheet sheet = workbook.getSheetAt(s);
                sb.append("── Feuille: ").append(sheet.getSheetName()).append(" ──\n");

                int maxRow = Math.min(sheet.getLastRowNum(), 500);
                for (int r = 0; r <= maxRow; r++) {
                    Row row = sheet.getRow(r);
                    if (row == null) continue;

                    List<String> cells = new ArrayList<>();
                    for (int c = 0; c < row.getLastCellNum(); c++) {
                        Cell cell = row.getCell(c);
                        cells.add(cell != null ? formatter.formatCellValue(cell) : "");
                    }
                    sb.append(String.join(" | ", cells)).append("\n");
                }
                sb.append("\n");
            }
        }

        return sb.toString();
    }

    /** PDF → extracted text */
    private String extractFromPdf(MultipartFile file) throws Exception {
        StringBuilder sb = new StringBuilder();
        sb.append("=== DOCUMENT PDF ===\n\n");

        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            // Limit to first 50 pages
            stripper.setEndPage(Math.min(doc.getNumberOfPages(), 50));
            sb.append(stripper.getText(doc));
        }

        return sb.toString();
    }

    /** Plain text / Markdown → direct read */
    private String extractFromText(MultipartFile file) throws Exception {
        return new String(file.getBytes(), StandardCharsets.UTF_8);
    }

    // ───────────────────────────────────────────────────────
    // LLM Prompt
    // ───────────────────────────────────────────────────────

    private String buildExtractionPrompt(String content, String projectName, String fileName) {
        return """
            Tu es un expert PMO (Project Management Officer) senior.
            
            Un chef de projet vient de te fournir un document concernant le projet "%s".
            Le fichier s'appelle "%s".
            
            Analyse le contenu ci-dessous et extrais TOUTES les informations exploitables
            pour évaluer la santé du projet. Sois exhaustif et précis.
            
            === CONTENU DU DOCUMENT ===
            %s
            === FIN DU DOCUMENT ===
            
            Génère un objet JSON avec la structure suivante:
            {
              "summary": "Résumé exécutif en 2-3 phrases — diagnostic global du projet",
              "overall_health": "SOLEIL | NUAGE_CLAIR | NUAGE_CHARGE | ORAGE",
              "confidence": 0.85,
              "indicators": [
                {
                  "name": "nom de l'indicateur (ex: Avancement, Budget consommé, Qualité)",
                  "category": "COST | QUALITY | DELAY | SCOPE | TEAM",
                  "currentValue": 75,
                  "targetValue": 100,
                  "unit": "%% | jours | € | /100",
                  "trend": "UP | DOWN | STABLE",
                  "state": "GREEN | YELLOW | ORANGE | RED"
                }
              ],
              "risks": [
                {
                  "title": "titre court du risque",
                  "description": "description du risque et son contexte",
                  "category": "TECHNICAL | ORGANIZATIONAL | EXTERNAL | FINANCIAL | PLANNING",
                  "probability": 3,
                  "impact": 4,
                  "severity": 12,
                  "status": "OPEN | MITIGATED | ACCEPTED"
                }
              ],
              "corrective_actions": [
                {
                  "title": "titre de l'action",
                  "description": "ce qu'il faut faire concrètement",
                  "priority": "LOW | MEDIUM | HIGH | CRITICAL",
                  "expectedImpact": "résultat attendu si appliqué",
                  "assignee": "personne ou équipe suggérée",
                  "deadline": "échéance suggérée"
                }
              ],
              "milestones": [
                {
                  "name": "nom du jalon",
                  "date": "date ou période",
                  "status": "DONE | IN_PROGRESS | LATE | PENDING"
                }
              ],
              "team_signals": {
                "workload": "UNDERLOADED | BALANCED | OVERLOADED",
                "morale": "HIGH | NORMAL | LOW | UNKNOWN",
                "notes": "observations sur l'équipe"
              },
              "budget": {
                "planned": 0,
                "consumed": 0,
                "remaining": 0,
                "unit": "€ | K€ | M€",
                "burnRate": "pourcentage ou rythme de consommation"
              },
              "timeline": {
                "startDate": "date de début si trouvée",
                "endDate": "date de fin prévue",
                "delayDays": 0,
                "criticalPath": "brève description du chemin critique si identifié"
              },
              "raw_observations": [
                "observation clé 1 directement extraite du document",
                "observation clé 2",
                "observation clé 3"
              ]
            }
            
            Règles:
            - probability et impact sont entre 1 et 5, severity = probability × impact
            - Si une information n'est pas dans le document, OMETS le champ (ne l'invente pas)
            - Extrais le MAXIMUM de données exploitables
            - Les champs numériques doivent être des nombres, pas des chaînes
            - overall_health reflète ton diagnostic global basé sur TOUTES les données extraites
            - confidence reflète ta confiance dans l'extraction (0.0 à 1.0)
            """.formatted(
                projectName != null ? projectName : "Projet inconnu",
                fileName != null ? fileName : "document",
                content
            );
    }
}
