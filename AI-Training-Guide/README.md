# Meteo Projet -- AI Engine Training Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [The 5-Layer Engine](#the-5-layer-engine)
3. [How the System Works (Zero Subjectivity)](#how-the-system-works)
4. [Generating Synthetic Training Data](#generating-synthetic-training-data)
5. [Evaluating Projection Accuracy](#evaluating-projection-accuracy)
6. [Tuning Weights and Thresholds](#tuning-weights-and-thresholds)
7. [Future ML Integration Path](#future-ml-integration-path)

---

## Architecture Overview

Meteo Projet uses a deterministic, rule-based AI engine to project future project health. Unlike traditional PMO tools that rely on manager opinion ("I think the project is going well"), every score in this system is computed from measurable data: action completion rates, budget variance, risk severity, indicator values, and team workload.

The engine takes the current state of a project and produces:
- A **projected meteo state** (SOLEIL / NUAGE_CLAIR / NUAGE_CHARGE / ORAGE)
- A **composite score** (0-100)
- A **confidence level** (LOW / MEDIUM / HIGH) with percentage
- **Three scenarios** (optimistic, nominal, pessimistic) from Monte Carlo simulation
- **Explanations** in natural language describing why the projection is what it is
- **Recommendations** for concrete actions to improve project health

### Data Flow

```
Historical Meteo Scores -----> [Layer 1: Trend Analyzer]      --\
Project Actions/Plan --------> [Layer 2: Plan Simulator]       --|
Action Statuses/Progress ----> [Layer 3: Action Plan Evaluator]--|-> Weighted  -> Composite -> Meteo
Risk Registry ---------------> [Layer 4: Risk Integrator]      --|   Composite    Score       State
Team/Workload Data ----------> [Layer 5: Capacity Analyzer]    --/

                                                                  \-> Confidence Calculator
                                                                  \-> Explanation Engine
                                                                  \-> Recommendation Engine
```

---

## The 5-Layer Engine

Each layer independently evaluates one dimension of project health, producing a `LayerResult` with:
- `score` (0-100): the layer's assessment
- `confidence` (0.0-1.0): how confident the layer is in its own assessment
- `explanation`: human-readable reasoning

The layers are combined using configurable weights that must sum to 1.0.

### Layer 1: Trend Analyzer (default weight: 30%)

**Purpose:** Projects the meteo trajectory based on historical scores.

**Algorithm:**
1. Fetches up to `max-history-points` (default: 10) most recent meteo history entries
2. Computes a **Weighted Moving Average (WMA)** giving more weight to recent data points
3. Performs **linear regression** on the score time series to find slope and intercept
4. Projects the score forward by `horizonDays / 7` periods
5. Blends the projection: `0.6 * linearProjection + 0.4 * WMA`
6. Clamps result to [0, 100]

**Confidence calculation:**
- `stabilityFactor`: penalizes high standard deviation in scores (stdDev / 30)
- `dataFactor`: rewards having more data points (count / 10)
- `consistencyFactor`: penalizes extreme slopes (>10 per period)
- Final: `stability * 0.4 + data * 0.4 + consistency * 0.2` (capped at 0.95)

**When data is insufficient** (fewer than `min-history-points` = 3): returns the latest score with 0.3 confidence.

### Layer 2: Plan Simulator (default weight: 25%)

**Purpose:** Monte Carlo simulation of project execution to estimate completion probability.

**Algorithm:**
1. Calculates current team velocity: `totalProgress / totalDays` across all active/completed actions
2. Calculates velocity variance across individual actions
3. Runs N iterations (default: 100, configurable 50-500):
   - For each action, simulates a random velocity drawn from `N(currentVelocity, variance)`
   - BLOCKED actions receive a random unblock probability between 0.3 and 0.7
   - Computes weighted completion for each iteration
4. Reports the **P50** (median) as the layer score
5. Also produces P10, P50, P90 for the three scenarios

**Confidence:** Based on the spread between P90 and P10. Narrow spread = high confidence.

### Layer 3: Action Plan Evaluator (default weight: 20%)

**Purpose:** Assesses plan health based on current execution status.

**Metrics computed:**
- Weighted progress across all actions
- Late ratio: actions past their planned end date or significantly behind expected progress
- Blocked ratio: actions in BLOCKED status
- On-track ratio: completed actions + actions within 80% of expected progress

**Score formula:**
```
score = completionScore * 0.3
      + (1 - lateRatio) * 100 * 0.3
      + (1 - blockedRatio) * 100 * 0.2
      + onTrackRatio * 100 * 0.2
```

**Confidence:** `0.5 + (actionCount * 0.03)`, capped at 0.9. More actions = more statistical significance.

### Layer 4: Risk Integrator (default weight: 15%)

**Purpose:** Evaluates risk exposure and mitigation coverage.

**Algorithm:**
1. Filters to active risks (excludes RESOLVED and ACCEPTED)
2. Computes total severity and unmitigated severity
3. Identifies high-severity unmitigated risks (severity >= 15)

**Score formula:**
```
score = 100
      - severityRatio * 40          (total severity / max possible)
      - (1 - mitigationCoverage) * 30  (% of severity without mitigation plans)
      - highSeverityUnmitigated * 10   (each unmitigated high-severity risk costs 10 points)
```

**When no risks exist:** Returns score 80 with confidence 0.5, because no risk register may indicate incomplete project setup rather than a risk-free project.

### Layer 5: Capacity Analyzer (default weight: 10%)

**Purpose:** Evaluates team workload distribution and resource availability.

**Metrics:**
- Average workload per team member
- Number of overloaded members (>1.5x average)
- Unassigned action ratio
- Workload balance (max-min spread relative to max)

**Score formula:**
```
score = 100
      - unassignedRatio * 30
      - overloadRatio * 30
      - (1 - workloadBalance) * 20
      - 10 if avgWorkload > 5
      - 10 more if avgWorkload > 8
```

---

## How the System Works

### Composite Score Calculation

```
compositeScore = trend.score * 0.30
               + simulation.score * 0.25
               + actionPlan.score * 0.20
               + risk.score * 0.15
               + capacity.score * 0.10
```

### Score-to-State Mapping

| Score Range | Meteo State   | Icon    |
|-------------|---------------|---------|
| >= 85       | SOLEIL        | Sun     |
| >= 70       | NUAGE_CLAIR   | Light cloud |
| >= 50       | NUAGE_CHARGE  | Heavy cloud |
| < 50        | ORAGE         | Storm   |

These thresholds are configurable in `application.yml` under `meteo.thresholds`.

### Confidence Calculation

The `ConfidenceCalculator` combines:

1. **Weighted layer confidence** (50%): each layer's self-assessed confidence, weighted by the layer's weight
2. **Inter-layer coherence** (30%): measures how much the 5 layer scores agree with each other. If all layers produce similar scores, coherence is high. Computed as `1 - stdDev(scores) / 50`
3. **Horizon decay factor** (20%): longer projections are inherently less reliable. `max(0.3, 1.0 - (horizonDays - 7) / 365)`

**Confidence levels:**
- HIGH: >= 70% (configurable)
- MEDIUM: >= 45% (configurable)
- LOW: < 45%

### Forcing Rules (Meteo Overrides)

Independent of the AI projection, the meteo calculation itself has forcing rules that can downgrade a meteo state regardless of indicator scores:

- Any action BLOCKED for more than `blocked-action-days` (5) consecutive days
- More than `late-actions-pct` (30%) of actions are late
- Budget consumed exceeds `budget-overrun-pct` (120%) of planned budget
- No updates for `no-update-days` (10) days

These forcing rules are recorded in meteo history and feed into the trend analyzer.

### CQD (Cost, Quality, Delay) Analysis

A separate system evaluates three dimensions:

- **Cost:** Budget variance percentage. ALIGNED if <= 5%, TENSION if <= 15%, CRITICAL if > 15%
- **Quality:** Composite quality indicator score. ALIGNED if >= 70, TENSION if >= 50, CRITICAL if < 50
- **Delay:** Progress variance. ALIGNED if >= -5%, TENSION if >= -15%, CRITICAL if < -15%

CQD states feed into the projection as projected_cost_state, projected_quality_state, and projected_delay_state.

---

## Generating Synthetic Training Data

### Why Synthetic Data?

When deploying Meteo Projet for the first time, the AI engine has no historical data. The trend analyzer cannot compute regressions, the Monte Carlo simulator has no velocity baseline, and confidence levels will be low.

Synthetic data solves this by:
1. Populating realistic project histories for testing
2. Validating that the engine produces sensible projections
3. Allowing weight tuning before real projects begin

### How to Generate

1. Start the application with Docker:
   ```bash
   docker-compose up -d
   ```

2. Wait for the database to be ready and Flyway migrations to complete.

3. Run the synthetic data generator:
   ```bash
   docker exec -i meteoapp-postgres-1 psql -U meteo_user -d meteo_db < AI-Training-Guide/synthetic-data-generator.sql
   ```

4. Verify the data:
   ```bash
   docker exec meteoapp-postgres-1 psql -U meteo_user -d meteo_db -c "SELECT name, status, criticality FROM projects;"
   ```

The generator creates 5 projects with distinct health profiles:
- **ERP Migration:** Healthy project (SOLEIL) -- on track, low risk
- **Mobile App Launch:** Struggling project (ORAGE) -- behind schedule, high risk
- **Cloud Infrastructure:** Recovering project (NUAGE_CHARGE -> NUAGE_CLAIR) -- was bad, improving
- **Data Warehouse:** Moderate project (NUAGE_CLAIR) -- some tensions but manageable
- **Security Audit:** New project (limited data) -- tests low-confidence scenarios

### Using the API Test Script

After generating synthetic data, run the API test scenarios:

```bash
chmod +x AI-Training-Guide/api-test-scenarios.sh
./AI-Training-Guide/api-test-scenarios.sh
```

This walks through the full API flow: authentication, project creation, indicator assignment, meteo calculation, and AI projection generation.

---

## Evaluating Projection Accuracy

### The Accuracy Loop

The projections table includes fields for retrospective validation:
- `actual_meteo`: the real meteo state at the target date
- `actual_score`: the real score at the target date
- `accuracy_score`: computed difference between projected and actual

### Step 1: Generate Projections at Regular Intervals

Set up weekly projection generation for all active projects. Use the API:

```
POST /api/v1/projections/projects/{projectId}
{
  "horizonDays": 30,
  "monteCarloIterations": 100
}
```

### Step 2: Record Actual Outcomes

When the target date arrives, compare the projection to reality:

```sql
-- Find projections whose target_date has passed
SELECT id, project_id, target_date, projected_meteo, projected_score
FROM projections
WHERE target_date <= CURRENT_DATE AND actual_meteo IS NULL;

-- Get the actual meteo at that date
SELECT meteo_state, calculated_score
FROM meteo_history
WHERE project_id = :projectId
  AND calculation_date <= :targetDate
ORDER BY calculation_date DESC
LIMIT 1;

-- Update the projection with actuals
UPDATE projections
SET actual_meteo = :actualState,
    actual_score = :actualScore,
    accuracy_score = ABS(projected_score - :actualScore)
WHERE id = :projectionId;
```

### Step 3: Analyze Accuracy

```sql
-- Overall accuracy statistics
SELECT
    COUNT(*) as total_projections,
    AVG(accuracy_score) as mean_absolute_error,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY accuracy_score) as median_error,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY accuracy_score) as p90_error,
    SUM(CASE WHEN projected_meteo = actual_meteo THEN 1 ELSE 0 END)::float / COUNT(*) as state_match_rate
FROM projections
WHERE actual_score IS NOT NULL;

-- Accuracy by horizon length
SELECT
    CASE
        WHEN horizon_days <= 14 THEN '1-2 weeks'
        WHEN horizon_days <= 30 THEN '2-4 weeks'
        WHEN horizon_days <= 90 THEN '1-3 months'
        ELSE '3+ months'
    END as horizon_bucket,
    COUNT(*) as count,
    AVG(accuracy_score) as mean_error,
    AVG(CASE WHEN projected_meteo = actual_meteo THEN 1.0 ELSE 0.0 END) as state_accuracy
FROM projections
WHERE actual_score IS NOT NULL
GROUP BY 1
ORDER BY 1;

-- Accuracy by confidence level
SELECT
    confidence_level,
    COUNT(*) as count,
    AVG(accuracy_score) as mean_error
FROM projections
WHERE actual_score IS NOT NULL
GROUP BY confidence_level;
```

### What to Look For

- **Mean Absolute Error < 10:** The engine is performing well
- **Mean Absolute Error 10-20:** Acceptable, but weight tuning may help
- **Mean Absolute Error > 20:** The weights need significant adjustment or the data quality is poor
- **State match rate > 70%:** Good -- the engine correctly predicts the weather icon most of the time
- **Higher confidence = lower error:** If this does NOT hold, the confidence calculator needs recalibration

---

## Tuning Weights and Thresholds

See `AI-Training-Guide/weight-tuning-guide.md` for the detailed tuning manual.

### Quick Reference

All weights and thresholds are in `backend/src/main/resources/application.yml` under the `meteo` section.

**Layer weights** (must sum to 1.0):
```yaml
meteo:
  ai:
    weights:
      trend: 0.30
      simulation: 0.25
      action-plan: 0.20
      risk: 0.15
      capacity: 0.10
```

**Meteo thresholds:**
```yaml
meteo:
  thresholds:
    soleil: 85
    nuage-clair: 70
    nuage-charge: 50
```

**Confidence thresholds:**
```yaml
meteo:
  ai:
    confidence:
      high-threshold: 70
      medium-threshold: 45
```

---

## Future ML Integration Path

The current rule-based engine is designed to be replaced or augmented by machine learning when sufficient historical data exists. Here is the recommended path:

### Phase 1: Data Collection (Months 1-6)

- Run projections weekly for all projects
- Ensure actual outcomes are recorded (see accuracy loop above)
- Target: 200+ projection-outcome pairs across at least 10 projects

### Phase 2: Feature Engineering (Month 6)

Export training data from the projections table:

```sql
SELECT
    p.horizon_days,
    p.trend_score,
    p.simulation_score,
    p.action_plan_score,
    p.risk_score,
    p.capacity_score,
    p.confidence_pct,
    p.projected_score,
    p.actual_score,
    p.accuracy_score
FROM projections p
WHERE p.actual_score IS NOT NULL;
```

Additional features to extract:
- Project age (days since start)
- Project size (action count, team size)
- Historical volatility (stddev of meteo scores)
- Risk density (risks per action)
- Budget utilization rate

### Phase 3: Model Training (Month 7)

**Recommended approach:** Train a gradient-boosted regression model (XGBoost or LightGBM) to predict `actual_score` from the 5 layer scores plus extracted features.

```python
# Pseudocode
import xgboost as xgb

features = ['trend_score', 'simulation_score', 'action_plan_score',
            'risk_score', 'capacity_score', 'horizon_days',
            'project_age', 'action_count', 'team_size',
            'historical_volatility', 'risk_density']

model = xgb.XGBRegressor(max_depth=4, n_estimators=100, learning_rate=0.1)
model.fit(X_train[features], y_train['actual_score'])

# The learned feature importances replace the manual weights
print(model.feature_importances_)
```

### Phase 4: Integration (Month 8)

Create a new projection layer or replace the composite score calculation:

1. **Option A -- ML as Layer 6:** Add an ML-based layer alongside the existing 5, with a configurable weight. Gradually increase its weight as accuracy improves.

2. **Option B -- ML Replaces Weighting:** Keep the 5 layers computing their scores, but let the ML model determine how to combine them instead of using fixed weights.

3. **Option C -- End-to-End ML:** Replace the entire engine with a model that takes raw project data (action statuses, indicator values, risk scores) and directly predicts meteo state. Requires the most data but has the highest ceiling.

**Recommended:** Start with Option B. It preserves the interpretability of the 5-layer architecture while learning optimal weights from data.

### Phase 5: Continuous Learning (Ongoing)

- Retrain the model monthly as new projection-outcome pairs become available
- Monitor for concept drift: project management patterns may change over time
- A/B test: run both rule-based and ML projections in parallel, compare accuracy
- Maintain the rule-based engine as a fallback for new projects with no history

### Data Requirements Summary

| Milestone | Data Needed | Capability |
|-----------|-------------|------------|
| Day 1 | 0 projections | Rule-based engine (current) |
| Month 3 | ~50 projections | Enough to validate accuracy and tune weights |
| Month 6 | ~200 projections | Enough to train a basic ML model |
| Month 12 | ~500+ projections | Robust ML model with good generalization |
| Month 18+ | 1000+ projections | Advanced models, per-project-type specialization |
