package com.meteoproject.service.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * Cloud-based Groq LLM integration service.
 * Connects to the blazing fast Groq inference engine via their OpenAI-compatible endpoint.
 *
 * Used by AIProjectService for: explanation, NL extraction, projection enrichment, recommendations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GroqService {

    private final ObjectMapper objectMapper;

    @Value("${ai.groq.base-url:https://api.groq.com/openai/v1}")
    private String baseUrl;

    @Value("${ai.groq.api-key:null}")
    private String apiKey;

    @Value("${ai.groq.model:llama-3.1-70b-versatile}")
    private String model;

    // ───────────────────────────────────────────────
    // Public API
    // ───────────────────────────────────────────────

    /** Send a prompt and get a raw text response. */
    public String generate(String prompt) {
        if ("null".equals(apiKey) || apiKey.isBlank()) {
            log.error("Groq API key is missing in configuration.");
            return buildFallbackResponse(prompt);
        }

        try {
            var request = buildRequest(prompt, false);
            var response = RestClient.builder()
                    .baseUrl(baseUrl)
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .build()
                    .post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(GroqResponse.class);

            if (response != null && response.choices != null && !response.choices.isEmpty()) {
                String content = response.choices.get(0).message.content;
                if (content != null && !content.isBlank()) {
                    log.debug("Groq response received ({} chars)", content.length());
                    return content.trim();
                }
            }
            log.warn("Groq returned empty response");
            return "Aucune réponse générée par le modèle IA.";
        } catch (Exception e) {
            log.error("Groq API call failed: {}", e.getMessage());
            return buildFallbackResponse(prompt);
        }
    }

    /** Send a prompt and parse the response as JSON into a Map. */
    public Map<String, Object> generateJson(String prompt) {
        // We instruct the model heavily on JSON to ensure reliable parsing.
        String jsonPrompt = prompt + """
                
                ----------
                CRITICAL INSTRUCTION:
                You MUST return ONLY a valid JSON object.
                Do NOT wrap the JSON in markdown formatting blocks (e.g. no ```json).
                Do NOT add any opening or closing commentary.
                Start the response immediately with '{' and end immediately with '}'.
                Ensure all keys are properly quoted and valid JSON syntax is used.
                """;

        String raw = generate(jsonPrompt);

        // Strip markdown code fences if the model still wraps its response
        raw = raw.replaceAll("(?s)```json\\s*", "")
                 .replaceAll("(?s)```\\s*", "")
                 .trim();

        // Extract JSON object if there's surrounding text
        int firstBrace = raw.indexOf('{');
        int lastBrace = raw.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            raw = raw.substring(firstBrace, lastBrace + 1);
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = objectMapper.readValue(raw, Map.class);
            return result;
        } catch (Exception e) {
            log.error("Failed to parse Groq JSON response: {}\nRaw: {}", e.getMessage(), raw);
            return Map.of(
                "error", "Impossible de parser la réponse IA",
                "raw", raw.length() > 500 ? raw.substring(0, 500) + "..." : raw
            );
        }
    }

    // ───────────────────────────────────────────────
    // Internal helpers
    // ───────────────────────────────────────────────

    private Map<String, Object> buildRequest(String prompt, boolean stream) {
        return Map.of(
            "model", model,
            "messages", List.of(
                Map.of(
                    "role", "user",
                    "content", prompt
                )
            ),
            "stream", stream,
            "temperature", 0.1, // Low temperature for consistent JSON structure and analytical thinking
            "max_tokens", 4096,
            "top_p", 0.9
        );
    }

    /**
     * When Groq is unavailable or API key is missing, return a structured fallback
     * so the app still works (degraded but functional).
     */
    private String buildFallbackResponse(String prompt) {
        if (prompt.contains("summary") || prompt.contains("indicators")) {
            return """
                {
                  "summary": "Analyse IA indisponible — veuillez configurer la clé API Groq (ai.groq.api-key).",
                  "indicators": [],
                  "risks": [],
                  "corrective_actions": [],
                  "overall_health": "NUAGE_CHARGE",
                  "confidence": 0.0
                }
                """;
        }
        return "Le moteur IA (Groq) n'est pas configuré. Veuillez renseigner la clé API Groq dans les paramètres.";
    }

    // ───────────────────────────────────────────────
    // Response DTO (OpenAI/Groq compatible)
    // ───────────────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class GroqResponse {
        public List<Choice> choices;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Choice {
        public Message message;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Message {
        public String role;
        public String content;
    }
}
