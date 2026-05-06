package com.meteoproject.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * High-level AI features built on top of OllamaService (local LLM):
 *
 *  1. explainMeteo()     — human language narrative for a météo score
 *  2. extractFromText()  — NL input → structured project data
 *  3. enrichProjection() — richer projection reasoning
 *  4. recommendActions() — prioritized corrective action suggestions
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIProjectService {

    private final GroqService ai;

    // ───────────────────────────────────────────────────────────
    // 1. EXPLAIN MÉTÉO — narrative explanation of a score
    // ───────────────────────────────────────────────────────────

    public String explainMeteo(MeteoContext ctx) {
        String prompt = """
            Tu es un assistant expert en gestion de projet. Explique en 3-4 phrases claires 
            et professionnelles (en français) pourquoi ce projet a reçu un score météo de %d/100 (%s).
            
            Contexte du projet:
            - Nom: %s
            - Score indicateurs: %d/100
            - Score risques: %d/100
            - Score plan d'actions: %d/100
            - Score CQD: %d/100
            - Météo forcée: %s
            - Règle de forçage: %s
            
            Donne une explication concrète orientée vers les causes, sans jargon technique.
            Ne mentionne pas les scores numériques, parle des causes réelles.
            """.formatted(
                ctx.score(), ctx.state(),
                ctx.projectName(),
                ctx.indicatorScore(), ctx.riskScore(), ctx.planScore(), ctx.cqdScore(),
                ctx.forced() ? "Oui" : "Non",
                ctx.forcingRule() != null ? ctx.forcingRule() : "Aucune"
            );
        return ai.generate(prompt);
    }

    // ───────────────────────────────────────────────────────────
    // 2. NATURAL LANGUAGE INPUT → STRUCTURED DATA
    // ───────────────────────────────────────────────────────────

    public Map<String, Object> extractFromNaturalLanguage(String projectName, String userText) {
        String prompt = """
            Tu es un assistant IA expert en gestion de projet. 
            
            L'utilisateur décrit la situation actuelle du projet "%s" en langage naturel.
            
            Description: "%s"
            
            Extrais les informations structurées et retourne un JSON avec exactement cette structure:
            {
              "summary": "résumé en une phrase de la situation",
              "indicators": [
                {
                  "name": "nom de l'indicateur",
                  "category": "PROGRESS|BUDGET|QUALITY|RISK|RESOURCE",
                  "currentValue": 0,
                  "targetValue": 100,
                  "unit": "%%",
                  "trend": "UP|DOWN|STABLE",
                  "state": "GREEN|YELLOW|ORANGE|RED"
                }
              ],
              "risks": [
                {
                  "title": "titre du risque",
                  "description": "description",
                  "category": "TECHNICAL|ORGANIZATIONAL|EXTERNAL|FINANCIAL|SCHEDULE",
                  "probability": 1,
                  "impact": 1,
                  "severity": 1,
                  "status": "IDENTIFIED|ACTIVE|MITIGATED"
                }
              ],
              "corrective_actions": [
                {
                  "title": "titre de l'action",
                  "description": "description de l'action",
                  "priority": "LOW|MEDIUM|HIGH|CRITICAL",
                  "expectedImpact": "impact attendu"
                }
              ],
              "overall_health": "SOLEIL|NUAGE_CLAIR|NUAGE_CHARGE|ORAGE",
              "confidence": 0.85
            }
            
            Règles: probability et impact sont entre 1 et 5, severity = probability * impact.
            Si une information n'est pas mentionnée, infère-la du contexte ou omet le tableau.
            """.formatted(projectName, userText);

        return ai.generateJson(prompt);
    }

    // ───────────────────────────────────────────────────────────
    // 3. ENRICH PROJECTION — add LLM reasoning to Monte Carlo
    // ───────────────────────────────────────────────────────────

    public Map<String, Object> enrichProjection(ProjectionContext ctx) {
        String prompt = """
            Tu es un expert en analyse prédictive de projets. 
            
            Une simulation Monte Carlo a prédit la météo du projet "%s" à J+%d:
            - Scénario optimiste: %s (score %.1f, probabilité %.0f%%)
            - Scénario nominal: %s (score %.1f, probabilité %.0f%%)
            - Scénario pessimiste: %s (score %.1f, probabilité %.0f%%)
            - Niveau de confiance: %s (%d%%)
            
            Contexte actuel:
            - Météo actuelle: %s (score %d)
            - Nombre d'actions ouvertes: %d
            - Risques actifs: %d
            
            Génère une réponse JSON avec:
            {
              "narrative": "analyse narrative de 2-3 phrases expliquant la prédiction",
              "key_factors": [
                {"factor": "facteur", "direction": "POSITIVE|NEGATIVE", "explanation": "explication courte"}
              ],
              "recommendations": [
                {
                  "title": "titre",
                  "description": "description",
                  "priority": "LOW|MEDIUM|HIGH|CRITICAL",
                  "category": "PLANNING|RISK|BUDGET|TEAM|QUALITY",
                  "expectedImpact": "impact si appliqué"
                }
              ],
              "risk_alert": "alerte principale ou null"
            }
            """.formatted(
                ctx.projectName(), ctx.horizonDays(),
                ctx.optimisticState(), ctx.optimisticScore(), ctx.optimisticProb() * 100,
                ctx.nominalState(), ctx.nominalScore(), ctx.nominalProb() * 100,
                ctx.pessimisticState(), ctx.pessimisticScore(), ctx.pessimisticProb() * 100,
                ctx.confidenceLevel(), ctx.confidencePct(),
                ctx.currentState(), ctx.currentScore(),
                ctx.openActions(), ctx.activeRisks()
            );

        return ai.generateJson(prompt);
    }

    // ───────────────────────────────────────────────────────────
    // 4. SMART RECOMMENDATIONS — pure AI recommendations
    // ───────────────────────────────────────────────────────────

    public Map<String, Object> generateRecommendations(RecommendationContext ctx) {
        String prompt = """
            Tu es un coach expert en gestion de projets complexes.
            
            Analyse la situation du projet "%s" et génère des recommandations concrètes:
            
            Situation:
            - Météo: %s (score %d/100)
            - Budget consommé: %.1f%% du budget alloué
            - Avancement réel: %.1f%% vs prévu %.1f%%
            - Score qualité: %d/100
            - Actions en retard: %d
            - Risques critiques: %d
            - Météo forcée: %s
            
            Génère un JSON avec:
            {
              "summary": "diagnostic en une phrase",
              "urgency": "NORMAL|ELEVATED|CRITICAL",
              "recommendations": [
                {
                  "title": "titre de la recommandation",
                  "description": "que faire concrètement",
                  "priority": "LOW|MEDIUM|HIGH|CRITICAL",
                  "category": "PLANNING|RISK|BUDGET|TEAM|QUALITY|GOVERNANCE",
                  "expectedImpact": "résultat attendu",
                  "timeframe": "Immédiat|Cette semaine|Ce mois"
                }
              ],
              "warning_signs": ["signe1", "signe2"],
              "positive_points": ["point1", "point2"]
            }
            
            Génère entre 3 et 6 recommandations, ordonnées par priorité décroissante.
            """.formatted(
                ctx.projectName(), ctx.meteoState(), ctx.score(),
                ctx.budgetConsumedPct(), ctx.actualProgress(), ctx.plannedProgress(),
                ctx.qualityScore(), ctx.lateActions(), ctx.criticalRisks(),
                ctx.forced() ? "Oui — " + ctx.forcingRule() : "Non"
            );

        return ai.generateJson(prompt);
    }

    // ───────────────────────────────────────────────────────────
    // Context records (simple value holders)
    // ───────────────────────────────────────────────────────────

    public record MeteoContext(
        String projectName, String state, int score,
        int indicatorScore, int riskScore, int planScore, int cqdScore,
        boolean forced, String forcingRule
    ) {}

    public record ProjectionContext(
        String projectName, int horizonDays,
        String optimisticState, double optimisticScore, double optimisticProb,
        String nominalState,    double nominalScore,    double nominalProb,
        String pessimisticState,double pessimisticScore,double pessimisticProb,
        String confidenceLevel, int confidencePct,
        String currentState, int currentScore,
        int openActions, int activeRisks
    ) {}

    public record RecommendationContext(
        String projectName, String meteoState, int score,
        double budgetConsumedPct, double actualProgress, double plannedProgress,
        int qualityScore, int lateActions, int criticalRisks,
        boolean forced, String forcingRule
    ) {}
}
