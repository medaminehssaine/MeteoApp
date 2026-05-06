# CAHIER DES CHARGES - METEO PROJET v2.0

## 1. Vision & Contexte

### 1.1 Problème
Les directeurs de projets IT prennent des décisions critiques basées sur des rapports subjectifs. Un chef de projet optimiste masque les risques, un pessimiste déclenche des alertes inutiles. Le résultat : **des projets qui dérivent sans que personne ne le voie venir.**

### 1.2 Solution : Météo Projet
**Principe fondamental : ZERO SUBJECTIVITÉ.**

Le chef de projet saisit des **faits** (avancement, budget consommé, jalons atteints). Le système **calcule** l'état du projet. L'IA **prédit** la trajectoire.

```
FAITS (input) → CALCUL (engine) → ÉTAT (météo) → PRÉDICTION (IA)
```

### 1.3 Métaphore Météo
| État | Score | Icône | Signification |
|------|-------|-------|---------------|
| SOLEIL | 85-100 | ☀️ | Projet en excellente santé |
| NUAGE_CLAIR | 70-84 | 🌤️ | Vigilance requise sur certains points |
| NUAGE_CHARGE | 50-69 | ☁️ | Dégradation significative, actions nécessaires |
| ORAGE | 0-49 | ⛈️ | Situation critique, intervention immédiate |

### 1.4 Triptyque CQD (Coût - Qualité - Délai)
Chaque dimension évaluée indépendamment :
| État | Signification |
|------|---------------|
| ALIGNED | Dans les limites acceptables |
| UNDER_TENSION | Écart détecté, surveillance renforcée |
| DEGRADED | Dépassement critique |

---

## 2. Périmètre Fonctionnel

### 2.1 Modules Principaux

| # | Module | Description | Priorité |
|---|--------|-------------|----------|
| M1 | Authentification & RBAC | JWT, 6 rôles, permissions granulaires | MUST |
| M2 | Gestion Projets | CRUD projets, configuration, archivage | MUST |
| M3 | Plan Projet | Actions, dépendances, chemin critique, Gantt | MUST |
| M4 | Indicateurs | Bibliothèque, saisie, scoring, seuils | MUST |
| M5 | Moteur Météo | Calcul, pondération, agrégation, forçage | MUST |
| M6 | Triptyque CQD | Écarts C/Q/D, tendances, historique | MUST |
| M7 | Actions Correctives | Création, suivi, lien indicateurs | MUST |
| M8 | Module IA & Projections | Prédictions, scénarios, recommandations | MUST |
| M9 | Dashboard & Reporting | Tableaux de bord, exports PDF/Excel | MUST |
| M10 | Administration | Gestion users, audit log, paramétrage | MUST |
| M11 | Notifications | Alertes temps réel, emails, digest | SHOULD |
| M12 | API Publique | REST API documentée pour intégrations | SHOULD |

### 2.2 Rôles & Permissions (RBAC)

| Permission | ADMIN | SPONSOR | DIRECTOR | CHEF | MEMBER | OBSERVER |
|-----------|-------|---------|----------|------|--------|----------|
| Gérer utilisateurs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Créer projet | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Configurer projet | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Créer/modifier actions | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Mettre à jour avancement | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Saisir indicateurs | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Consulter météo | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Consulter projections IA | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Exporter rapports | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Valider périmètre | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Archiver projet | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## 3. Règles Métier

### 3.1 Règles de Saisie (R1-R5)
- **R1** : L'avancement d'une action est un entier entre 0 et 100
- **R2** : Une action bloquée doit avoir une raison et un type de blocage
- **R3** : Les indicateurs sont saisis selon la fréquence configurée (daily/weekly/biweekly/monthly)
- **R4** : Le budget consommé ne peut pas dépasser le budget total + 50%
- **R5** : Les dates réelles ne peuvent pas précéder les dates de création du projet

### 3.2 Règles de Calcul (R10-R14)

**R10 - Avancement Global :**
```
Avancement = Σ(durée_action_i × avancement_i) / Σ(durée_action_i) × 100
```

**R11 - Score Indicateur (0-100) :**
```
Si valeur >= seuil_vert     → score = 80 + (valeur - seuil_vert) / (100 - seuil_vert) × 20
Si valeur >= seuil_orange   → score = 50 + (valeur - seuil_orange) / (seuil_vert - seuil_orange) × 30
Si valeur >= seuil_rouge    → score = 20 + (valeur - seuil_rouge) / (seuil_orange - seuil_rouge) × 30
Si valeur < seuil_rouge     → score = valeur / seuil_rouge × 20
```

**R12 - Pondération avec Criticité :**
```
Score_pondéré = Σ(score_i × poids_i × coeff_criticité_i) / Σ(poids_i × coeff_criticité_i)
```
Coefficients de criticité : LOW=0.5, MEDIUM=1.0, HIGH=1.5, CRITICAL=2.0

**R13 - Agrégation par Module :**
```
Score_module = Σ(score_indicateur_j × poids_j) / Σ(poids_j)  [pour les indicateurs du module]
```

**R14 - Score Projet Final :**
```
Score_projet = Σ(score_module_k × poids_module_k) / Σ(poids_module_k)
```

### 3.3 Règles de Forçage (R20-R24)
Ces règles **forcent ORAGE** indépendamment du score calculé :

| Règle | Condition | Justification |
|-------|-----------|---------------|
| R20 | ≥ 1 action bloquée depuis > 5 jours | Blocage persistant = risque projet |
| R21 | ≥ 30% des actions en retard | Retard systémique |
| R22 | Budget consommé > 120% du prévu | Dérive budgétaire critique |
| R23 | ≥ 1 indicateur CRITICAL sans action corrective | Indicateur critique non traité |
| R24 | Aucune mise à jour depuis > 10 jours | Projet potentiellement abandonné |

### 3.4 Conversion Score → Météo
```
score >= 85 → SOLEIL
score >= 70 → NUAGE_CLAIR
score >= 50 → NUAGE_CHARGE
score < 50  → ORAGE
```

### 3.5 Règles CQD

**Coût :**
```
écart_coût = (budget_consommé / budget_prévu_à_date - 1) × 100
  écart <= 5%  → ALIGNED
  écart <= 15% → UNDER_TENSION
  écart > 15%  → DEGRADED
```

**Qualité :**
```
score_qualité = moyenne des indicateurs catégorie QUALITY
  score >= 70 → ALIGNED
  score >= 50 → UNDER_TENSION
  score < 50  → DEGRADED
```

**Délai :**
```
écart_délai = (avancement_réel / avancement_prévu - 1) × 100
  écart >= -5%  → ALIGNED
  écart >= -15% → UNDER_TENSION
  écart < -15%  → DEGRADED
```

---

## 4. Bibliothèque d'Indicateurs

### 4.1 Catégorie PROGRESS
| Code | Nom | Unité | Seuils (V/O/R) | Poids |
|------|-----|-------|-----------------|-------|
| PRG-001 | Avancement global | % | 90/75/50 | 30 |
| PRG-002 | Respect jalons | % | 95/80/60 | 25 |
| PRG-003 | Taux actions terminées | % | 85/70/50 | 20 |
| PRG-004 | Vélocité équipe | Score | 80/60/40 | 15 |
| PRG-005 | Taux actions bloquées | % (inversé) | 5/15/30 | 10 |

### 4.2 Catégorie BUDGET
| Code | Nom | Unité | Seuils (V/O/R) | Poids |
|------|-----|-------|-----------------|-------|
| BDG-001 | Écart budgétaire | % | 5/15/30 | 35 |
| BDG-002 | Taux consommation | % | 95/110/130 | 30 |
| BDG-003 | Projection fin projet | DHS | 5/15/30 | 20 |
| BDG-004 | ROI prévisionnel | % | 80/60/40 | 15 |

### 4.3 Catégorie RISK
| Code | Nom | Unité | Seuils (V/O/R) | Poids |
|------|-----|-------|-----------------|-------|
| RSK-001 | Nombre risques ouverts | Nombre | 3/7/12 | 30 |
| RSK-002 | Sévérité moyenne | Score | 30/50/70 | 35 |
| RSK-003 | Risques matérialisés | Nombre | 1/3/5 | 20 |
| RSK-004 | Couverture mitigation | % | 80/60/40 | 15 |

### 4.4 Catégorie QUALITY
| Code | Nom | Unité | Seuils (V/O/R) | Poids |
|------|-----|-------|-----------------|-------|
| QAL-001 | Taux défauts | % (inversé) | 5/15/30 | 30 |
| QAL-002 | Couverture tests | % | 80/60/40 | 25 |
| QAL-003 | Conformité livrables | % | 90/75/50 | 25 |
| QAL-004 | Satisfaction client | Score | 80/60/40 | 20 |

### 4.5 Catégorie RESOURCE
| Code | Nom | Unité | Seuils (V/O/R) | Poids |
|------|-----|-------|-----------------|-------|
| RES-001 | Taux occupation | % | 85/95/110 | 30 |
| RES-002 | Turnover équipe | % (inversé) | 5/15/30 | 25 |
| RES-003 | Disponibilité compétences | % | 90/70/50 | 25 |
| RES-004 | Charge vs capacité | Ratio | 1.0/1.2/1.5 | 20 |

---

## 5. Stack Technique

### 5.1 Backend
| Composant | Technologie | Version |
|-----------|-------------|---------|
| Runtime | Java | 17+ (LTS) |
| Framework | Spring Boot | 3.2+ |
| Security | Spring Security + JWT | 6.x |
| ORM | Spring Data JPA / Hibernate | 6.x |
| Database | PostgreSQL | 15+ |
| Migration | Flyway | 9.x |
| Cache | Redis | 7.x |
| Validation | Jakarta Validation | 3.x |
| Documentation | SpringDoc OpenAPI | 2.x |
| Build | Maven | 3.9+ |
| Tests | JUnit 5 + Mockito + Testcontainers | - |

### 5.2 Frontend
| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | Angular | 17+ (standalone) |
| State Management | NgRx (Signal Store) | 17+ |
| UI Components | Angular Material + Custom | 17+ |
| Charts | Chart.js + ng2-charts | 4.x |
| Gantt | dhtmlx-gantt ou custom D3.js | - |
| HTTP | HttpClient + Interceptors | - |
| Forms | Reactive Forms | - |
| i18n | ngx-translate | 15+ |
| Tests | Jest + Cypress | - |

### 5.3 Infrastructure
| Composant | Technologie |
|-----------|-------------|
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Monitoring | Spring Actuator + Micrometer |
| Logging | SLF4J + Logback (JSON) |
| API Gateway | Spring Cloud Gateway (optionnel) |

---

## 6. Exigences Non-Fonctionnelles

### 6.1 Performance
| Métrique | Cible |
|----------|-------|
| Temps chargement page | < 2s |
| Calcul météo | < 3s |
| Génération projection IA | < 5s |
| Export PDF | < 10s |
| Temps réponse API (P95) | < 500ms |
| Requêtes simultanées | 100+ |

### 6.2 Sécurité
- Authentification JWT (access token 1h, refresh token 7j)
- Mots de passe hashés BCrypt (cost factor 12)
- HTTPS obligatoire
- Protection CSRF, XSS, SQL Injection
- Rate limiting : 100 req/min par IP
- Audit log de toutes les actions sensibles
- CORS configuré strictement

### 6.3 Qualité Code
- Couverture tests unitaires : > 70%
- Couverture tests intégration : > 50%
- 0 vulnérabilité critique (OWASP)
- Code review obligatoire
- SonarQube quality gate : PASS

---

## 7. Livrables

| # | Livrable | Format |
|---|----------|--------|
| L1 | Code source Backend | Java/Spring Boot |
| L2 | Code source Frontend | Angular/TypeScript |
| L3 | Scripts de migration DB | Flyway SQL |
| L4 | Documentation API | OpenAPI 3.0 |
| L5 | Docker Compose | YAML |
| L6 | Tests automatisés | JUnit + Cypress |
| L7 | Guide de déploiement | Markdown |
| L8 | Guide utilisateur | PDF |
