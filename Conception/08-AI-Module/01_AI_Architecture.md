# MODULE IA - ARCHITECTURE DÉTAILLÉE

## 1. Vue d'Ensemble

Le module IA de Météo Projet est un **moteur de projection multi-couches** qui combine 5 axes d'analyse pour prédire la trajectoire d'un projet. Contrairement à un modèle ML classique qui nécessite des milliers de datapoints, ce moteur utilise des **algorithmes déterministes enrichis par des heuristiques**, conçus pour fonctionner dès le premier jour d'un projet.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROJECTION ENGINE                            │
│                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ LAYER 1 │ │ LAYER 2 │ │ LAYER 3 │ │ LAYER 4 │ │ LAYER 5 │ │
│  │  Trend  │ │  Plan   │ │ Action  │ │  Risk   │ │Capacity │ │
│  │Analysis │ │Simulator│ │  Plan   │ │Integr.  │ │Analysis │ │
│  │  (30%)  │ │  (25%)  │ │  (20%)  │ │  (15%)  │ │  (10%)  │ │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ │
│       │           │           │           │           │       │
│       ▼           ▼           ▼           ▼           ▼       │
│  ┌────────────────────────────────────────────────────────────┐│
│  │              PROJECTION COMPOSITOR                        ││
│  │         Weighted combination + normalization               ││
│  └──────────────────────┬────────────────────────────────────┘│
│                         │                                     │
│       ┌─────────────────┼─────────────────┐                  │
│       ▼                 ▼                 ▼                  │
│  ┌─────────┐     ┌──────────┐     ┌────────────┐            │
│  │Scenario │     │Confidence│     │Explanation │            │
│  │Generator│     │Calculator│     │  Engine    │            │
│  └─────────┘     └──────────┘     └────────────┘            │
│       │                 │                 │                  │
│       ▼                 ▼                 ▼                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   PROJECTION RESULT                    │  │
│  │  • Projected Météo (SOLEIL → ORAGE)                   │  │
│  │  • Projected Score (0-100)                             │  │
│  │  • Confidence Level (HIGH/MEDIUM/LOW)                  │  │
│  │  • 3 Scenarios (Nominal/Optimistic/Pessimistic)        │  │
│  │  • Top 3 Key Factors                                   │  │
│  │  • Recommendations                                     │  │
│  │  • Human-readable Explanation                          │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. LAYER 1 : Trend Analyzer (Poids: 30%)

### 2.1 Objectif
Analyser les tendances historiques des indicateurs pour projeter leur évolution future.

### 2.2 Algorithme : Weighted Moving Average + Linear Regression

```java
/**
 * TrendAnalyzer.java
 *
 * Analyse les N dernières valeurs de chaque indicateur du projet
 * pour déterminer une tendance (slope) et projeter la valeur future.
 */

// STEP 1: Collecter l'historique (min 3 points, max 10)
List<IndicatorValueHistory> history = getHistory(indicator, maxPoints=10);

// STEP 2: Appliquer un Weighted Moving Average (récent = plus important)
// Poids: [1, 2, 3, ..., N] → les valeurs récentes comptent plus
double[] weights = generateLinearWeights(history.size());
double wma = weightedMovingAverage(history, weights);

// STEP 3: Calculer la pente par régression linéaire
// y = mx + b où m = pente (trend)
LinearRegression regression = new LinearRegression(history);
double slope = regression.getSlope();           // variation par jour
double rSquared = regression.getRSquared();      // qualité du fit (0-1)

// STEP 4: Projeter la valeur future
double projectedValue = wma + (slope * horizonDays);
projectedValue = clamp(projectedValue, 0, 100);

// STEP 5: Calculer la confiance de cette couche
double layerConfidence = rSquared * dataQualityFactor(history.size());
```

### 2.3 Facteur de Qualité des Données

```
dataQualityFactor(n):
  n >= 8  → 1.0    (excellent : assez de données pour une tendance fiable)
  n >= 5  → 0.8    (bon : tendance visible)
  n >= 3  → 0.6    (minimum : tendance estimée)
  n < 3   → 0.3    (insuffisant : fallback sur la valeur courante)
```

### 2.4 Détection de Tendance

```
Si slope > +2.0/jour    → STRONG_IMPROVING   (accélération positive)
Si slope > +0.5/jour    → IMPROVING          (amélioration graduelle)
Si |slope| <= 0.5/jour  → STABLE             (plateau)
Si slope < -0.5/jour    → DETERIORATING      (dégradation graduelle)
Si slope < -2.0/jour    → STRONG_DETERIORATING (chute rapide)
```

### 2.5 Sortie

```json
{
  "trendScore": 72.5,
  "indicators": [
    {
      "code": "PRG-001",
      "currentValue": 65,
      "projectedValue": 78,
      "trend": "IMPROVING",
      "slope": 1.3,
      "confidence": 0.82
    }
  ],
  "overallTrend": "IMPROVING",
  "layerConfidence": 0.75
}
```

---

## 3. LAYER 2 : Plan Simulator (Poids: 25%)

### 3.1 Objectif
Simuler l'exécution du plan projet en respectant les dépendances, deadlines et vélocité pour projeter l'avancement.

### 3.2 Algorithme : Critical Path Method + Monte Carlo Light

```java
/**
 * PlanSimulator.java
 *
 * Simule N exécutions du plan projet avec des variations
 * stochastiques sur les durées pour obtenir une distribution
 * des résultats possibles.
 */

// STEP 1: Construire le graphe de dépendances (DAG)
DirectedAcyclicGraph<Action> dag = buildDependencyGraph(project);
List<Action> criticalPath = dag.findCriticalPath();
int criticalPathLength = sumDurations(criticalPath);

// STEP 2: Calculer la vélocité observée de l'équipe
VelocityStats velocity = calculateVelocity(project);
// velocity.mean = actions terminées / semaine (moyenne)
// velocity.stdDev = écart type
// velocity.trend = ACCELERATING | STABLE | DECELERATING

// STEP 3: Monte Carlo Light (100 simulations)
int N_SIMULATIONS = 100;
double[] simulatedScores = new double[N_SIMULATIONS];

for (int i = 0; i < N_SIMULATIONS; i++) {
    // Varier les durées restantes avec un facteur aléatoire
    // Distribution: Normal(1.0, 0.15) → ±15% de variation
    Map<Action, Integer> adjustedDurations = new HashMap<>();
    for (Action action : remainingActions) {
        double factor = 1.0 + random.nextGaussian() * 0.15;
        factor = clamp(factor, 0.7, 1.5);
        adjustedDurations.put(action, (int)(action.getRemainingDays() * factor));
    }

    // Simuler l'exécution séquentielle en respectant les dépendances
    SimulationResult result = simulateExecution(dag, adjustedDurations, velocity);
    simulatedScores[i] = result.getProjectedScore();
}

// STEP 4: Analyser la distribution
double mean = Statistics.mean(simulatedScores);
double p25 = Statistics.percentile(simulatedScores, 25);  // pessimiste
double p75 = Statistics.percentile(simulatedScores, 75);  // optimiste
double stdDev = Statistics.stdDev(simulatedScores);

// STEP 5: Score de la couche = moyenne pondérée par la vélocité
double simulationScore = mean * velocityAdjustment(velocity);
```

### 3.3 Calcul de la Vélocité

```
Vélocité = Nombre d'actions complétées dans les 14 derniers jours
           pondéré par la durée de chaque action

velocityRatio = vélocité_observée / vélocité_planifiée

velocityAdjustment:
  ratio >= 1.1 → 1.10  (équipe plus rapide que prévu → bonus +10%)
  ratio >= 0.9 → 1.00  (dans la norme)
  ratio >= 0.7 → 0.90  (légère sous-performance → pénalité -10%)
  ratio < 0.7  → 0.80  (sous-performance significative → -20%)
```

### 3.4 Analyse du Chemin Critique

```
criticalPathHealth:
  - % du chemin critique déjà complété
  - Présence d'actions bloquées sur le chemin critique → ALERTE
  - Marge totale restante (total float)
  - Buffer time restant

criticalPathScore:
  Si aucune action bloquée sur CP et avancement >= prévu → 90-100
  Si actions en retard sur CP mais non bloquées → 60-80
  Si action bloquée sur CP → 30-50
  Si multiple actions bloquées sur CP → 0-30
```

### 3.5 Sortie

```json
{
  "simulationScore": 68.3,
  "meanProjectedProgress": 78.5,
  "optimisticProgress": 85.2,
  "pessimisticProgress": 71.8,
  "completionProbability": {
    "onTime": 0.65,
    "delayed1Week": 0.82,
    "delayed2Weeks": 0.93
  },
  "criticalPath": {
    "length": 45,
    "completed": 22,
    "blockedActions": 1,
    "health": "AT_RISK"
  },
  "velocity": {
    "observed": 3.2,
    "planned": 3.5,
    "ratio": 0.91,
    "trend": "STABLE"
  },
  "layerConfidence": 0.70
}
```

---

## 4. LAYER 3 : Action Plan Evaluator (Poids: 20%)

### 4.1 Objectif
Évaluer l'efficacité des actions correctives en cours et leur impact probable sur les indicateurs dégradés.

### 4.2 Algorithme

```java
/**
 * ActionPlanEvaluator.java
 *
 * Évalue chaque indicateur en état WARNING/ALERT/CRITICAL
 * et vérifie si des actions correctives sont en place et efficaces.
 */

// STEP 1: Identifier les indicateurs problématiques
List<ProjectIndicator> problematicIndicators = indicators.stream()
    .filter(i -> i.getState().isWorseOrEqual(WARNING))
    .collect(toList());

// STEP 2: Pour chaque indicateur, évaluer le plan d'action
double totalScore = 0;
for (ProjectIndicator indicator : problematicIndicators) {
    List<CorrectiveAction> actions = getCorrectiveActions(indicator);

    if (actions.isEmpty()) {
        // Indicateur dégradé SANS action corrective = score très bas
        totalScore += 10;
        flags.add("INDICATOR_WITHOUT_ACTION: " + indicator.getCode());
    } else {
        double actionScore = evaluateActions(actions);
        totalScore += actionScore;
    }
}

// STEP 3: Score global normalisé
double evaluationScore = totalScore / problematicIndicators.size();
```

### 4.3 Évaluation d'une Action Corrective

```
evaluateAction(action):
  score = 0

  // Pertinence (est-ce que l'action cible le bon problème?)
  Si action.indicator != null:
    score += 20

  // Assignation (quelqu'un est responsable?)
  Si action.responsible != null:
    score += 15

  // Délai (deadline réaliste et pas dépassée?)
  Si action.deadline > today AND remainingDays > 0:
    score += 20
  Si action.deadline < today:
    score -= 10  // Action en retard = pénalité

  // Statut
  Si status == COMPLETED:
    score += 30
    // Vérifier impact réel sur l'indicateur
    Si indicatorImproved(action):
      score += 15  // Bonus: l'action a réellement amélioré les choses
  Si status == IN_PROGRESS:
    score += 15
  Si status == OPEN:
    score += 5   // Créée mais pas encore commencée

  return clamp(score, 0, 100)
```

### 4.4 Détection d'Indicateurs sans Action (Règle de Forçage R23)

```
Pour chaque indicateur en état CRITICAL:
  Si aucune action corrective active (OPEN ou IN_PROGRESS):
    → Flag: CRITICAL_WITHOUT_ACTION
    → Contribue au forçage ORAGE (R23)
    → Score de cette couche fortement pénalisé
```

### 4.5 Sortie

```json
{
  "actionPlanScore": 55.0,
  "problematicIndicators": 4,
  "coveredIndicators": 3,
  "uncoveredIndicators": 1,
  "actionEffectiveness": {
    "completed": { "count": 2, "withImpact": 1, "avgScore": 78 },
    "inProgress": { "count": 3, "onTime": 2, "avgScore": 62 },
    "overdue": { "count": 1, "avgScore": 25 }
  },
  "flags": ["CRITICAL_WITHOUT_ACTION: RSK-002"],
  "layerConfidence": 0.65
}
```

---

## 5. LAYER 4 : Risk Integrator (Poids: 15%)

### 5.1 Objectif
Quantifier l'impact des risques ouverts sur la trajectoire du projet.

### 5.2 Algorithme : Risk-Adjusted Score

```java
/**
 * RiskIntegrator.java
 *
 * Intègre les risques identifiés dans le calcul de projection
 * en quantifiant leur impact potentiel sur le score météo.
 */

// STEP 1: Collecter les risques actifs (non fermés)
List<Risk> activeRisks = risks.stream()
    .filter(r -> r.getStatus() != CLOSED)
    .sorted(comparing(Risk::getSeverity).reversed())
    .collect(toList());

// STEP 2: Calculer le Risk Exposure Score
double totalExposure = 0;
for (Risk risk : activeRisks) {
    double exposure = risk.getProbability() * risk.getImpact() / 100.0;

    // Ajuster selon le statut
    switch (risk.getStatus()) {
        case IDENTIFIED:   exposure *= 1.0;  break;  // Risque brut
        case ANALYZING:    exposure *= 0.9;  break;  // En cours d'analyse
        case MITIGATING:   exposure *= 0.6;  break;  // Mitigation en cours
        case MATERIALIZED: exposure *= 1.5;  break;  // Risque matérialisé = impact max
    }

    // Ajuster selon la catégorie et l'horizon
    exposure *= categoryHorizonFactor(risk.getCategory(), horizonDays);

    totalExposure += exposure;
}

// STEP 3: Normaliser l'exposition (0-100)
double normalizedExposure = Math.min(totalExposure / MAX_ACCEPTABLE_EXPOSURE * 100, 100);

// STEP 4: Calculer le score de risque (inversé: peu de risques = score élevé)
double riskScore = 100 - normalizedExposure;

// STEP 5: Bonus si bonne couverture mitigation
double mitigationCoverage = countWithMitigation / totalActive;
if (mitigationCoverage > 0.8) riskScore += 5;
```

### 5.3 Facteur Catégorie × Horizon

```
categoryHorizonFactor(category, horizon):
  Les risques TECHNICAL et RESOURCE ont plus d'impact à court terme.
  Les risques BUDGET et PLANNING ont plus d'impact à long terme.

  Matrice:
                    J+7    J+14   J+30   J+60
  TECHNICAL         1.5    1.2    0.8    0.5
  RESOURCE          1.3    1.1    0.9    0.7
  BUDGET            0.6    0.8    1.2    1.5
  PLANNING          0.5    0.7    1.0    1.3
  QUALITY           1.0    1.0    1.0    1.0
  EXTERNAL          0.8    0.9    1.0    1.1
```

### 5.4 Sortie

```json
{
  "riskScore": 62.0,
  "totalExposure": 38.0,
  "activeRisks": 5,
  "topRisks": [
    { "title": "Départ développeur senior", "severity": 72, "status": "MITIGATING" },
    { "title": "Retard livraison composant", "severity": 56, "status": "IDENTIFIED" }
  ],
  "mitigationCoverage": 0.60,
  "materializedRisks": 0,
  "layerConfidence": 0.70
}
```

---

## 6. LAYER 5 : Capacity Analyzer (Poids: 10%)

### 6.1 Objectif
Évaluer si l'équipe a la capacité (charge de travail, compétences, disponibilité) pour maintenir ou améliorer la trajectoire.

### 6.2 Algorithme

```java
/**
 * CapacityAnalyzer.java
 *
 * Analyse la charge de travail vs la capacité disponible
 * pour déterminer si le plan est réalisable.
 */

// STEP 1: Calculer la charge restante
int totalRemainingDays = actions.stream()
    .filter(a -> a.getStatus() != COMPLETED)
    .mapToInt(a -> a.getRemainingDays())
    .sum();

// STEP 2: Calculer la capacité disponible jusqu'à l'horizon
int teamSize = getActiveTeamMembers(project).size();
int workingDaysInHorizon = calculateWorkingDays(today, today.plusDays(horizonDays));
int totalCapacity = teamSize * workingDaysInHorizon;

// STEP 3: Ratio charge/capacité
double loadRatio = (double) totalRemainingDays / totalCapacity;

// STEP 4: Ajuster selon les indicateurs ressource
double resourceScore = getResourceIndicatorAverage(project);

// STEP 5: Calculer le score de capacité
double capacityScore;
if (loadRatio <= 0.8) {
    capacityScore = 95;   // Sous-chargé: capacité de manoeuvre
} else if (loadRatio <= 1.0) {
    capacityScore = 80;   // Charge nominale
} else if (loadRatio <= 1.2) {
    capacityScore = 60;   // Surcharge légère
} else if (loadRatio <= 1.5) {
    capacityScore = 40;   // Surcharge importante
} else {
    capacityScore = 20;   // Surcharge critique
}

// Ajuster avec le score des indicateurs ressource (si disponible)
if (resourceScore > 0) {
    capacityScore = capacityScore * 0.6 + resourceScore * 0.4;
}
```

### 6.3 Sortie

```json
{
  "capacityScore": 72.0,
  "loadRatio": 1.05,
  "remainingWorkDays": 42,
  "availableCapacity": 40,
  "teamSize": 5,
  "capacityStatus": "SLIGHTLY_OVERLOADED",
  "layerConfidence": 0.60
}
```

---

## 7. PROJECTION COMPOSITOR

### 7.1 Composition Finale

```java
/**
 * ProjectionCompositor.java
 *
 * Combine les 5 couches avec leurs poids pour produire
 * le score de projection final.
 */

// Poids des couches
static final double W_TREND = 0.30;
static final double W_SIMULATION = 0.25;
static final double W_ACTION_PLAN = 0.20;
static final double W_RISK = 0.15;
static final double W_CAPACITY = 0.10;

public Projection compose(
    TrendResult trend,
    SimulationResult simulation,
    ActionPlanResult actionPlan,
    RiskResult risk,
    CapacityResult capacity
) {
    // STEP 1: Score pondéré
    double projectedScore =
        trend.getScore()      * W_TREND +
        simulation.getScore() * W_SIMULATION +
        actionPlan.getScore() * W_ACTION_PLAN +
        risk.getScore()       * W_RISK +
        capacity.getScore()   * W_CAPACITY;

    // STEP 2: Convertir en météo
    MeteoState projectedMeteo = convertToMeteo(projectedScore);

    // STEP 3: Calculer la confiance
    ConfidenceResult confidence = confidenceCalculator.calculate(
        trend, simulation, actionPlan, risk, capacity, horizonDays
    );

    // STEP 4: Générer les scénarios
    Scenarios scenarios = scenarioGenerator.generate(
        projectedScore, trend, simulation, risk
    );

    // STEP 5: Générer les recommandations
    List<Recommendation> recommendations = recommendationEngine.generate(
        trend, simulation, actionPlan, risk, capacity
    );

    // STEP 6: Générer l'explication
    String explanation = explanationEngine.generate(
        projectedScore, projectedMeteo, confidence,
        trend, simulation, actionPlan, risk, capacity
    );

    // STEP 7: Projeter le CQD
    ProjectedCQD projectedCQD = projectCQD(
        trend, simulation, risk, horizonDays
    );

    return Projection.builder()
        .projectedScore(projectedScore)
        .projectedMeteo(projectedMeteo)
        .confidence(confidence)
        .scenarios(scenarios)
        .recommendations(recommendations)
        .explanation(explanation)
        .projectedCQD(projectedCQD)
        .componentScores(Map.of(
            "trend", trend.getScore(),
            "simulation", simulation.getScore(),
            "actionPlan", actionPlan.getScore(),
            "risk", risk.getScore(),
            "capacity", capacity.getScore()
        ))
        .build();
}
```

---

## 8. CONFIDENCE CALCULATOR

### 8.1 Formule de Confiance

```java
/**
 * ConfidenceCalculator.java
 *
 * Calcule un niveau de confiance pour la projection en combinant :
 * 1. La confiance de chaque couche (qualité de l'analyse)
 * 2. La cohérence entre les couches (convergence)
 * 3. La quantité de données historiques
 * 4. L'horizon de projection (plus loin = moins confiant)
 */

// STEP 1: Confiance pondérée des couches
double layerConfidence =
    trend.getConfidence()      * W_TREND +
    simulation.getConfidence() * W_SIMULATION +
    actionPlan.getConfidence() * W_ACTION_PLAN +
    risk.getConfidence()       * W_RISK +
    capacity.getConfidence()   * W_CAPACITY;

// STEP 2: Cohérence inter-couches (convergence)
double[] scores = {trend.getScore(), simulation.getScore(),
                   actionPlan.getScore(), risk.getScore(), capacity.getScore()};
double stdDev = Statistics.stdDev(scores);
double coherence;
if (stdDev < 10) coherence = 1.0;     // Très cohérent
else if (stdDev < 20) coherence = 0.8; // Assez cohérent
else if (stdDev < 30) coherence = 0.6; // Divergences modérées
else coherence = 0.4;                   // Divergences fortes → signal d'alerte

// STEP 3: Facteur horizon (decay exponentiel)
double horizonFactor;
switch (horizonDays) {
    case 7:  horizonFactor = 0.95; break;
    case 14: horizonFactor = 0.85; break;
    case 21: horizonFactor = 0.75; break;
    case 30: horizonFactor = 0.65; break;
    case 60: horizonFactor = 0.45; break;
    default: horizonFactor = 0.50;
}

// STEP 4: Facteur données historiques
int historySize = getHistorySize(project);
double dataFactor;
if (historySize >= 20) dataFactor = 1.0;
else if (historySize >= 10) dataFactor = 0.85;
else if (historySize >= 5) dataFactor = 0.70;
else dataFactor = 0.50;

// STEP 5: Confiance finale
double confidencePercentage =
    layerConfidence * 0.35 +
    coherence * 0.25 +
    horizonFactor * 0.25 +
    dataFactor * 0.15;

confidencePercentage = confidencePercentage * 100;

// STEP 6: Convertir en niveau
ConfidenceLevel level;
if (confidencePercentage >= 70) level = HIGH;
else if (confidencePercentage >= 45) level = MEDIUM;
else level = LOW;
```

### 8.2 Matrice de Confiance

```
                        Horizon
                 J+7    J+14   J+21   J+30   J+60
Data >= 20      HIGH   HIGH   MED    MED    LOW
Data 10-19      HIGH   MED    MED    LOW    LOW
Data 5-9        MED    MED    LOW    LOW    LOW
Data < 5        MED    LOW    LOW    LOW    LOW
```

---

## 9. SCENARIO GENERATOR

### 9.1 Les 3 Scénarios

```java
/**
 * ScenarioGenerator.java
 *
 * Génère 3 scénarios basés sur les résultats de la simulation
 * et des analyses de tendance.
 */

public Scenarios generate(double projectedScore, TrendResult trend,
                           SimulationResult simulation, RiskResult risk) {

    // NOMINAL: Le score calculé avec les paramètres actuels
    Scenario nominal = Scenario.builder()
        .type("NOMINAL")
        .score(projectedScore)
        .meteo(convertToMeteo(projectedScore))
        .probability(calculateNominalProbability(trend, simulation))
        .description(generateNominalDescription(projectedScore))
        .assumptions(List.of(
            "La vélocité de l'équipe reste constante",
            "Aucun nouveau risque ne se matérialise",
            "Les actions correctives en cours produisent l'effet attendu"
        ))
        .build();

    // OPTIMISTIC: Tout se passe mieux que prévu
    double optimisticScore = projectedScore + calculateOptimisticDelta(simulation, risk);
    optimisticScore = Math.min(optimisticScore, 100);
    Scenario optimistic = Scenario.builder()
        .type("OPTIMISTIC")
        .score(optimisticScore)
        .meteo(convertToMeteo(optimisticScore))
        .probability(calculateOptimisticProbability(trend))
        .description(generateOptimisticDescription(optimisticScore))
        .assumptions(List.of(
            "L'équipe accélère sa vélocité de +15%",
            "Les risques en cours de mitigation sont résolus",
            "Le chemin critique n'est pas impacté"
        ))
        .build();

    // PESSIMISTIC: Les risques se matérialisent
    double pessimisticScore = projectedScore - calculatePessimisticDelta(simulation, risk);
    pessimisticScore = Math.max(pessimisticScore, 0);
    Scenario pessimistic = Scenario.builder()
        .type("PESSIMISTIC")
        .score(pessimisticScore)
        .meteo(convertToMeteo(pessimisticScore))
        .probability(calculatePessimisticProbability(risk))
        .description(generatePessimisticDescription(pessimisticScore))
        .assumptions(List.of(
            "Un risque majeur se matérialise",
            "La vélocité de l'équipe diminue de -20%",
            "Une action du chemin critique est bloquée"
        ))
        .build();

    return new Scenarios(nominal, optimistic, pessimistic);
}

// Delta optimiste basé sur le P75 de la simulation
double calculateOptimisticDelta(SimulationResult sim, RiskResult risk) {
    double simulationBonus = sim.getOptimisticProgress() - sim.getMeanProgress();
    double riskBonus = risk.getMitigationCoverage() * 5; // Bonus si bonne mitigation
    return simulationBonus + riskBonus;
}

// Delta pessimiste basé sur le P25 + risques
double calculatePessimisticDelta(SimulationResult sim, RiskResult risk) {
    double simulationPenalty = sim.getMeanProgress() - sim.getPessimisticProgress();
    double riskPenalty = risk.getTotalExposure() * 0.5;
    return simulationPenalty + riskPenalty;
}
```

---

## 10. EXPLANATION ENGINE

### 10.1 Architecture de Génération d'Explications

```java
/**
 * ExplanationEngine.java
 *
 * Génère des explications en langage naturel (français)
 * pour rendre les projections compréhensibles par les décideurs.
 *
 * Architecture: Template-based + Rule-based NLG
 */

public String generate(ProjectionContext ctx) {
    StringBuilder explanation = new StringBuilder();

    // SECTION 1: Résumé de la projection
    explanation.append(generateSummary(ctx));

    // SECTION 2: Facteurs clés (top 3)
    explanation.append(generateKeyFactors(ctx));

    // SECTION 3: Points d'attention
    explanation.append(generateWarnings(ctx));

    // SECTION 4: Comparaison avec la période précédente
    explanation.append(generateComparison(ctx));

    return explanation.toString();
}
```

### 10.2 Templates d'Explication

```java
// === SUMMARY TEMPLATES ===

// Template: Projection positive (score projeté > score actuel)
"Le projet {projectName} devrait évoluer vers une météo {projectedMeteo} "
+ "(score {projectedScore}/100) à J+{horizon}. "
+ "Cette amélioration est principalement portée par {topFactor}."

// Template: Projection stable
"Le projet {projectName} devrait maintenir sa météo {currentMeteo} "
+ "(score projeté {projectedScore}/100) à J+{horizon}. "
+ "La situation est stable avec {stableFactorsCount} indicateurs constants."

// Template: Projection dégradée
"⚠️ Le projet {projectName} risque de se dégrader vers {projectedMeteo} "
+ "(score {projectedScore}/100) à J+{horizon}. "
+ "Le principal facteur de risque est {topRiskFactor}."

// === KEY FACTORS TEMPLATES ===

// Factor: Trend improving
"📈 Tendance positive : {count} indicateurs en amélioration, "
+ "notamment {topImproving} (+{improvingDelta} pts)."

// Factor: Blocked actions
"🚫 Actions bloquées : {count} actions bloquées depuis {avgDays} jours "
+ "dont {criticalCount} sur le chemin critique."

// Factor: Risk materialized
"⚠️ Risque matérialisé : \"{riskTitle}\" (sévérité {severity}/100) "
+ "impacte directement l'avancement du projet."

// Factor: Action plan effective
"✅ Plan d'action efficace : {completedCount} actions correctives terminées "
+ "ont amélioré {impactedCount} indicateurs."

// Factor: Capacity issue
"👥 Capacité sous tension : ratio charge/capacité à {loadRatio}, "
+ "l'équipe est en {capacityStatus}."

// === WARNING TEMPLATES ===

// Warning: No corrective action on critical indicator
"🔴 L'indicateur {indicatorName} est en état CRITICAL sans action "
+ "corrective associée. Cela pourrait déclencher un forçage ORAGE."

// Warning: Deadline approaching
"⏰ La date de fin du projet est dans {remainingDays} jours avec "
+ "un avancement de {progress}%. Le retard estimé est de {delayDays} jours."

// Warning: Budget overrun
"💰 Le budget consommé ({consumed} DHS) dépasse de {overrunPct}% "
+ "le budget prévu à date ({planned} DHS)."
```

---

## 11. RECOMMENDATION ENGINE

### 11.1 Système de Recommandations

```java
/**
 * RecommendationEngine.java
 *
 * Génère des recommandations actionnables basées sur l'analyse
 * multi-couches. Chaque recommandation est priorisée et liée
 * à un facteur spécifique.
 */

public List<Recommendation> generate(ProjectionContext ctx) {
    List<Recommendation> recommendations = new ArrayList<>();

    // Règle 1: Actions bloquées → Débloquer
    if (ctx.blockedActionsOnCriticalPath > 0) {
        recommendations.add(Recommendation.builder()
            .priority(CRITICAL)
            .category("PLAN")
            .title("Débloquer les actions du chemin critique")
            .description("Il y a " + ctx.blockedActionsOnCriticalPath
                + " actions bloquées sur le chemin critique. "
                + "Chaque jour de blocage retarde la date de fin.")
            .expectedImpact("+10 à +15 pts sur le score météo")
            .effort("IMMEDIATE")
            .build());
    }

    // Règle 2: Indicateur CRITICAL sans action corrective → Créer
    for (Indicator i : ctx.criticalWithoutAction) {
        recommendations.add(Recommendation.builder()
            .priority(HIGH)
            .category("INDICATOR")
            .title("Créer une action corrective pour " + i.getName())
            .description("L'indicateur " + i.getCode() + " est en état "
                + "CRITICAL. Sans action corrective, la règle de forçage "
                + "R23 maintiendra le projet en ORAGE.")
            .expectedImpact("Évite le forçage ORAGE (R23)")
            .effort("SHORT_TERM")
            .build());
    }

    // Règle 3: Tendance dégradante → Investiguer
    for (Indicator i : ctx.deterioratingIndicators) {
        recommendations.add(Recommendation.builder()
            .priority(MEDIUM)
            .category("TREND")
            .title("Investiguer la dégradation de " + i.getName())
            .description("L'indicateur " + i.getCode() + " se dégrade "
                + "depuis " + i.getDegradationDays() + " jours "
                + "(pente: " + i.getSlope() + "/jour).")
            .expectedImpact("Prévenir un passage en ALERT/CRITICAL")
            .effort("MEDIUM_TERM")
            .build());
    }

    // Règle 4: Surcharge équipe → Ajuster
    if (ctx.capacity.loadRatio > 1.2) {
        recommendations.add(Recommendation.builder()
            .priority(MEDIUM)
            .category("RESOURCE")
            .title("Réduire la charge de l'équipe")
            .description("Le ratio charge/capacité est à "
                + ctx.capacity.loadRatio + ". Risque de burnout et "
                + "de baisse de qualité.")
            .expectedImpact("+5 à +8 pts sur le score")
            .effort("MEDIUM_TERM")
            .build());
    }

    // Règle 5: Risques non mitigés → Planifier
    if (ctx.risk.mitigationCoverage < 0.6) {
        recommendations.add(Recommendation.builder()
            .priority(MEDIUM)
            .category("RISK")
            .title("Élaborer des plans de mitigation")
            .description("Seulement " + (int)(ctx.risk.mitigationCoverage * 100)
                + "% des risques ont un plan de mitigation. "
                + "Objectif: >80%.")
            .expectedImpact("Réduction de l'exposition aux risques")
            .effort("SHORT_TERM")
            .build());
    }

    // Règle 6: Budget en dérive → Alerter
    if (ctx.costVariance > 15) {
        recommendations.add(Recommendation.builder()
            .priority(HIGH)
            .category("BUDGET")
            .title("Revoir le plan budgétaire")
            .description("L'écart budgétaire est de " + ctx.costVariance
                + "%. Au rythme actuel, le dépassement en fin de "
                + "projet sera de " + ctx.projectedOverrun + "%.")
            .expectedImpact("Maîtrise du budget")
            .effort("IMMEDIATE")
            .build());
    }

    // Trier par priorité
    recommendations.sort(comparing(Recommendation::getPriority));

    // Limiter à 5 recommandations max (pour ne pas noyer le décideur)
    return recommendations.stream().limit(5).collect(toList());
}
```

### 11.2 Structure d'une Recommandation

```json
{
  "priority": "HIGH",
  "category": "PLAN",
  "title": "Débloquer l'action 'Migration base de données'",
  "description": "Cette action est bloquée depuis 7 jours sur le chemin critique. Le blocage est de type TECHNICAL. Chaque jour de blocage retarde la date de fin du projet.",
  "expectedImpact": "+12 pts sur le score météo, -3 jours sur le retard",
  "effort": "IMMEDIATE",
  "relatedEntities": {
    "actionId": "uuid-xxx",
    "indicatorCodes": ["PRG-005"]
  }
}
```

---

## 12. HORIZONS DE PROJECTION

### 12.1 Météo

| Horizon | Usage | Confiance typique |
|---------|-------|-------------------|
| J+7 | Alerte court terme | HIGH (70-90%) |
| J+14 | Planification sprint | MEDIUM-HIGH (55-75%) |
| J+21 | Anticipation | MEDIUM (45-65%) |

### 12.2 CQD

| Horizon | Usage | Confiance typique |
|---------|-------|-------------------|
| J+14 | Suivi budgétaire | HIGH (65-85%) |
| J+30 | Reporting mensuel | MEDIUM (50-70%) |
| J+60 | Vision stratégique | LOW-MEDIUM (35-55%) |

---

## 13. ACCURACY TRACKING (Auto-évaluation)

### 13.1 Suivi de la Précision

```java
/**
 * AccuracyTracker.java
 *
 * Quand la date cible d'une projection est atteinte,
 * compare le score projeté avec le score réel pour mesurer
 * la précision du moteur.
 *
 * Exécuté quotidiennement par un @Scheduled job.
 */

@Scheduled(cron = "0 0 2 * * *")  // Tous les jours à 2h
public void trackAccuracy() {
    // Trouver les projections dont la target_date est aujourd'hui
    List<Projection> maturedProjections = projectionRepository
        .findByTargetDateAndActualMeteoIsNull(LocalDate.now());

    for (Projection projection : maturedProjections) {
        // Récupérer la météo réelle du jour
        MeteoHistory actual = meteoHistoryRepository
            .findByProjectIdAndCalculationDate(
                projection.getProjectId(), LocalDate.now()
            );

        if (actual != null) {
            // Calculer le score de précision
            double scoreDiff = Math.abs(
                projection.getProjectedScore() - actual.getCalculatedScore()
            );
            double accuracyScore = Math.max(0, 100 - scoreDiff * 2);

            // Mettre à jour la projection
            projection.setActualMeteo(actual.getMeteoState());
            projection.setActualScore(actual.getCalculatedScore());
            projection.setAccuracyScore(accuracyScore);
            projectionRepository.save(projection);
        }
    }
}
```

### 13.2 Métriques de Précision

```
Mean Absolute Error (MAE) = Σ|projected_score - actual_score| / N
Accuracy Rate = projections où |écart| < 10 pts / total
State Match Rate = projections où projected_meteo == actual_meteo / total
```

---

## 14. SYNTHETIC DATA GENERATOR

### 14.1 Objectif
Permettre de tester le moteur IA sans données historiques réelles.

### 14.2 Profils de Génération

```java
/**
 * SyntheticDataGenerator.java
 *
 * Génère des données synthétiques pour simuler différents
 * profils de projet et tester le moteur de projection.
 */

public enum ProjectProfile {
    HEALTHY,        // Projet en bonne santé, amélioration régulière
    DEGRADING,      // Projet qui se dégrade progressivement
    RECOVERING,     // Projet qui se remet d'une crise
    CHAOTIC,        // Projet instable avec des variations fortes
    BLOCKED,        // Projet avec de nombreuses actions bloquées
    BUDGET_OVERRUN  // Projet en dérive budgétaire
}

public void generateData(UUID projectId, ProjectProfile profile,
                          int numberOfWeeks) {
    for (int week = 0; week < numberOfWeeks; week++) {
        switch (profile) {
            case HEALTHY:
                generateHealthyWeek(projectId, week);
                break;
            case DEGRADING:
                generateDegradingWeek(projectId, week);
                break;
            case RECOVERING:
                generateRecoveringWeek(projectId, week);
                break;
            // ... etc
        }
    }
}

private void generateHealthyWeek(UUID projectId, int week) {
    // Score progresse de 60 → 90 sur 10 semaines
    double baseScore = 60 + (week * 3.0);
    double noise = random.nextGaussian() * 3;  // ±3 pts de bruit
    double score = clamp(baseScore + noise, 0, 100);

    // Indicateurs progressent régulièrement
    for (ProjectIndicator indicator : getIndicators(projectId)) {
        double value = generateTrendingValue(
            indicator.getCurrentValue(),
            +2.0,   // tendance positive
            5.0,    // bruit
            0, 100  // bornes
        );
        recordIndicatorValue(indicator, value, weekToDate(week));
    }

    // Compléter 2-3 actions par semaine
    int actionsToComplete = 2 + random.nextInt(2);
    completeRandomActions(projectId, actionsToComplete, weekToDate(week));
}

private void generateDegradingWeek(UUID projectId, int week) {
    // Score descend de 80 → 40 sur 10 semaines
    double baseScore = 80 - (week * 4.0);
    double noise = random.nextGaussian() * 5;
    double score = clamp(baseScore + noise, 0, 100);

    // Indicateurs se dégradent
    for (ProjectIndicator indicator : getIndicators(projectId)) {
        double value = generateTrendingValue(
            indicator.getCurrentValue(),
            -3.0,   // tendance négative
            8.0,    // plus de bruit (instabilité)
            0, 100
        );
        recordIndicatorValue(indicator, value, weekToDate(week));
    }

    // Bloquer 1 action par semaine à partir de la semaine 3
    if (week >= 3) {
        blockRandomAction(projectId, weekToDate(week));
    }
}
```

---

## 15. DIAGRAMME DE SÉQUENCE - PROJECTION COMPLÈTE

```
Client                ProjectionController      ProjectionService         TrendAnalyzer
  │                          │                        │                        │
  │  GET /projections?h=14   │                        │                        │
  ├─────────────────────────►│                        │                        │
  │                          │  generateProjection()  │                        │
  │                          ├───────────────────────►│                        │
  │                          │                        │  analyzeTrend()        │
  │                          │                        ├───────────────────────►│
  │                          │                        │                        │ Load history
  │                          │                        │                        │ Calculate WMA
  │                          │                        │                        │ Linear regression
  │                          │                        │  TrendResult           │ Project values
  │                          │                        │◄───────────────────────┤
  │                          │                        │
  │                          │                        │  PlanSimulator
  │                          │                        ├───────────────────────►│
  │                          │                        │                        │ Build DAG
  │                          │                        │                        │ Monte Carlo ×100
  │                          │                        │  SimulationResult      │ Analyze distribution
  │                          │                        │◄───────────────────────┤
  │                          │                        │
  │                          │                        │  (ActionPlanEvaluator, RiskIntegrator,
  │                          │                        │   CapacityAnalyzer → in parallel)
  │                          │                        │
  │                          │                        │  ProjectionCompositor
  │                          │                        ├───────────────────────►│
  │                          │                        │                        │ Weighted combine
  │                          │                        │                        │ Generate scenarios
  │                          │                        │                        │ Calculate confidence
  │                          │                        │                        │ Generate explanation
  │                          │                        │  Projection            │ Generate recommendations
  │                          │                        │◄───────────────────────┤
  │                          │                        │
  │                          │                        │  Save to DB
  │                          │                        │  Invalidate cache
  │                          │  ProjectionResponse    │
  │                          │◄───────────────────────┤
  │  200 OK + Projection     │
  │◄─────────────────────────┤
```

---

## 16. CONFIGURATION

```yaml
# application.yml - AI Module Configuration
meteo:
  ai:
    projection:
      # Layer weights (must sum to 1.0)
      weights:
        trend: 0.30
        simulation: 0.25
        action-plan: 0.20
        risk: 0.15
        capacity: 0.10

      # Trend analyzer
      trend:
        max-history-points: 10
        min-history-points: 3

      # Plan simulator
      simulation:
        monte-carlo-iterations: 100
        duration-variance: 0.15
        velocity-window-days: 14

      # Confidence
      confidence:
        high-threshold: 70
        medium-threshold: 45

      # Horizons
      meteo-horizons: [7, 14, 21]
      cqd-horizons: [14, 30, 60]

      # Accuracy tracking
      accuracy:
        cron: "0 0 2 * * *"

      # Recommendations
      recommendations:
        max-count: 5
```
