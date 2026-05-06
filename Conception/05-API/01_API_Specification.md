# API REST SPECIFICATION - METEO PROJET v2.0

**Base URL**: `/api/v1`
**Format**: JSON
**Authentication**: Bearer JWT
**Content-Type**: `application/json`

---

## 1. Authentication (`/api/v1/auth`)

### POST `/auth/login`
Authentifier un utilisateur.
- **Body**: `{ "email": "string", "password": "string" }`
- **Response 200**:
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "dGhpcyBpcyBh...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "defaultRole": "CHEF"
  }
}
```
- **401**: Identifiants invalides
- **423**: Compte verrouillé

### POST `/auth/refresh`
Rafraîchir le token d'accès.
- **Body**: `{ "refreshToken": "string" }`
- **Response 200**: `{ "accessToken": "eyJhbG...", "expiresIn": 3600 }`
- **401**: Refresh token invalide ou expiré

### POST `/auth/logout`
Révoquer le refresh token.
- **Headers**: `Authorization: Bearer <accessToken>`
- **Body**: `{ "refreshToken": "string" }`
- **Response 204**: No Content

### POST `/auth/forgot-password`
Demander la réinitialisation du mot de passe.
- **Body**: `{ "email": "string" }`
- **Response 200**: `{ "message": "Email envoyé si le compte existe" }`

### POST `/auth/reset-password`
Réinitialiser le mot de passe.
- **Body**: `{ "token": "string", "newPassword": "string" }`
- **Response 200**: `{ "message": "Mot de passe mis à jour" }`

---

## 2. Users (`/api/v1/users`)

### GET `/users`
Lister les utilisateurs (ADMIN only).
- **Query**: `?page=0&size=20&search=jean&active=true`
- **Response 200**:
```json
{
  "content": [
    {
      "id": "uuid",
      "email": "jean.dupont@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "phone": "+212600000000",
      "defaultRole": "CHEF",
      "active": true,
      "lastLoginAt": "2026-04-10T14:30:00Z",
      "createdAt": "2026-01-15T09:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 45,
  "totalPages": 3
}
```

### GET `/users/{id}`
Détails d'un utilisateur.

### POST `/users`
Créer un utilisateur (ADMIN only).
- **Body**:
```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "defaultRole": "MEMBER"
}
```
- **Response 201**: UserResponse

### PUT `/users/{id}`
Modifier un utilisateur.

### PATCH `/users/{id}/status`
Activer/désactiver (ADMIN only).
- **Body**: `{ "active": false }`

### GET `/users/me`
Profil de l'utilisateur connecté.

### PUT `/users/me`
Modifier son profil.

### PUT `/users/me/password`
Changer son mot de passe.
- **Body**: `{ "currentPassword": "string", "newPassword": "string" }`

---

## 3. Projects (`/api/v1/projects`)

### GET `/projects`
Lister les projets accessibles.
- **Query**: `?page=0&size=20&status=IN_PROGRESS&type=APPLICATION&search=migration`
- **Response 200**: Page<ProjectSummaryResponse>
```json
{
  "content": [
    {
      "id": "uuid",
      "name": "Migration Cloud",
      "code": "MIG-001",
      "status": "IN_PROGRESS",
      "type": "INFRASTRUCTURE",
      "criticality": "HIGH",
      "startDate": "2026-02-01",
      "endDate": "2026-06-30",
      "budgetTotal": 500000.00,
      "budgetConsumed": 175000.00,
      "currentMeteo": "NUAGE_CLAIR",
      "currentScore": 74.5,
      "costState": "ALIGNED",
      "qualityState": "ALIGNED",
      "delayState": "UNDER_TENSION",
      "progress": 35.0,
      "blockedActions": 1,
      "openRisks": 3,
      "daysRemaining": 80
    }
  ],
  "page": 0, "size": 20, "totalElements": 12, "totalPages": 1
}
```

### GET `/projects/{id}`
Détails complet d'un projet.
- **Response 200**: ProjectDetailResponse (includes latest météo, CQD, team, modules summary)

### POST `/projects`
Créer un projet (DIRECTOR only).
- **Body**:
```json
{
  "name": "Migration Cloud Azure",
  "code": "MIG-001",
  "shortDescription": "Migration de l'infrastructure on-premise vers Azure",
  "longDescription": "...",
  "startDate": "2026-02-01",
  "endDate": "2026-06-30",
  "budgetTotal": 500000.00,
  "type": "INFRASTRUCTURE",
  "criticality": "HIGH",
  "visibility": "RESTRICTED"
}
```
- **Response 201**: ProjectResponse

### PUT `/projects/{id}`
Modifier un projet.

### PATCH `/projects/{id}/status`
Changer le statut d'un projet.
- **Body**: `{ "status": "IN_PROGRESS" }`
- **Validations**: IN_PROGRESS requires modules + indicators + chef

### PATCH `/projects/{id}/budget`
Mettre à jour le budget consommé.
- **Body**: `{ "budgetConsumed": 200000.00 }`
- **Validation**: R4 (max 150% du total)

### DELETE `/projects/{id}`
Archiver un projet (DIRECTOR only, soft delete → status=ARCHIVED).

---

## 4. Project Team (`/api/v1/projects/{pid}/team`)

### GET `/projects/{pid}/team`
Lister les membres du projet avec leurs rôles.

### POST `/projects/{pid}/team`
Ajouter un membre.
- **Body**: `{ "userId": "uuid", "role": "MEMBER" }`

### PUT `/projects/{pid}/team/{userId}`
Modifier le rôle d'un membre.
- **Body**: `{ "role": "CHEF" }`

### DELETE `/projects/{pid}/team/{userId}`
Retirer un membre (soft delete: set removed_at).

---

## 5. Modules (`/api/v1/projects/{pid}/modules`)

### GET `/projects/{pid}/modules`
Lister les modules du projet.

### POST `/projects/{pid}/modules`
Créer un module.
- **Body**:
```json
{
  "name": "Backend API",
  "description": "Développement des services REST",
  "weight": 40.0,
  "responsibleId": "uuid",
  "startDate": "2026-02-15",
  "endDate": "2026-05-15",
  "orderIndex": 1
}
```
- **Validation**: Sum of all module weights ≤ 100

### PUT `/projects/{pid}/modules/{id}`
Modifier un module.

### DELETE `/projects/{pid}/modules/{id}`
Supprimer un module (cascade actions).

---

## 6. Actions (`/api/v1/projects/{pid}/actions`)

### GET `/projects/{pid}/actions`
Lister les actions.
- **Query**: `?moduleId=uuid&status=BLOCKED&responsibleId=uuid`

### GET `/projects/{pid}/actions/gantt`
Données formatées pour le diagramme de Gantt.
- **Response 200**:
```json
{
  "actions": [
    {
      "id": "uuid",
      "title": "Setup CI/CD",
      "moduleId": "uuid",
      "moduleName": "DevOps",
      "plannedStart": "2026-02-15",
      "plannedEnd": "2026-02-28",
      "actualStart": "2026-02-16",
      "actualEnd": null,
      "progress": 60,
      "status": "IN_PROGRESS",
      "isMilestone": false,
      "dependencies": [
        { "targetActionId": "uuid", "type": "FINISH_TO_START", "lagDays": 0 }
      ]
    }
  ],
  "criticalPath": ["uuid1", "uuid2", "uuid3"]
}
```

### POST `/projects/{pid}/actions`
Créer une action.
- **Body**:
```json
{
  "moduleId": "uuid",
  "title": "Développer API REST Users",
  "description": "CRUD endpoints pour la gestion des utilisateurs",
  "durationDays": 5,
  "plannedStart": "2026-03-01",
  "plannedEnd": "2026-03-05",
  "responsibleId": "uuid",
  "isMilestone": false,
  "dependencies": [
    { "targetActionId": "uuid", "type": "FINISH_TO_START", "lagDays": 0 }
  ]
}
```
- **Validation**: Circular dependency check

### PUT `/projects/{pid}/actions/{id}`
Modifier une action.

### PATCH `/projects/{pid}/actions/{id}/progress`
Mettre à jour l'avancement.
- **Body**: `{ "progress": 75 }`
- **Validation**: R1 (0-100)
- **Side effect**: Triggers météo + CQD recalculation (async)

### PATCH `/projects/{pid}/actions/{id}/block`
Déclarer un blocage.
- **Body**: `{ "blockingReason": "En attente validation archi", "blockingType": "DECISION" }`
- **Validation**: R2

### PATCH `/projects/{pid}/actions/{id}/unblock`
Débloquer une action.

### PATCH `/projects/{pid}/actions/{id}/complete`
Marquer comme terminée.
- **Side effect**: progress=100, actualEnd=today

### DELETE `/projects/{pid}/actions/{id}`
Supprimer une action.

---

## 7. Indicator Library (`/api/v1/indicators/library`)

### GET `/indicators/library`
Lister la bibliothèque d'indicateurs.
- **Query**: `?category=PROGRESS&active=true`

### GET `/indicators/library/{id}`
Détails d'un indicateur de la bibliothèque.

### POST `/indicators/library` (ADMIN)
Ajouter un indicateur à la bibliothèque.

### PUT `/indicators/library/{id}` (ADMIN)
Modifier un indicateur.

---

## 8. Project Indicators (`/api/v1/projects/{pid}/indicators`)

### GET `/projects/{pid}/indicators`
Lister les indicateurs du projet.
- **Response 200**:
```json
[
  {
    "id": "uuid",
    "code": "PRG-001",
    "name": "Avancement global",
    "category": "PROGRESS",
    "currentValue": 72.0,
    "currentScore": 76,
    "state": "GOOD",
    "weight": 30.0,
    "criticality": "HIGH",
    "criticalityCoefficient": 1.5,
    "frequency": "WEEKLY",
    "thresholds": { "green": 90, "orange": 75, "red": 50 },
    "lastMeasuredAt": "2026-04-07",
    "trend": "IMPROVING",
    "hasCorrectiveAction": false
  }
]
```

### POST `/projects/{pid}/indicators`
Ajouter un indicateur au projet (depuis la bibliothèque).
- **Body**:
```json
{
  "indicatorLibraryId": "uuid",
  "weight": 30.0,
  "criticality": "HIGH",
  "frequency": "WEEKLY",
  "thresholdGreen": 90,
  "thresholdOrange": 75,
  "thresholdRed": 50
}
```

### PUT `/projects/{pid}/indicators/{id}`
Modifier configuration d'un indicateur projet.

### POST `/projects/{pid}/indicators/{id}/values`
Enregistrer une valeur d'indicateur.
- **Body**: `{ "value": 72.0, "comment": "Sprint 5 terminé" }`
- **Response 201**:
```json
{
  "id": "uuid",
  "value": 72.0,
  "score": 76,
  "state": "GOOD",
  "previousValue": 65.0,
  "previousScore": 62,
  "delta": "+14 pts",
  "measuredAt": "2026-04-11"
}
```
- **Side effect**: Async météo + CQD recalculation

### GET `/projects/{pid}/indicators/{id}/history`
Historique des valeurs.
- **Query**: `?from=2026-01-01&to=2026-04-11&limit=20`

---

## 9. Météo (`/api/v1/projects/{pid}/meteo`)

### GET `/projects/{pid}/meteo/current`
Météo actuelle du projet.
- **Response 200**:
```json
{
  "meteoState": "NUAGE_CLAIR",
  "calculatedScore": 74.5,
  "rawScore": 74.5,
  "wasForced": false,
  "activeForcingRules": [],
  "calculationDate": "2026-04-11",
  "indicatorScores": {
    "PRG-001": { "value": 72, "score": 76, "state": "GOOD", "weight": 30 },
    "BDG-001": { "value": 8, "score": 68, "state": "WARNING", "weight": 35 }
  },
  "moduleScores": {
    "Backend API": { "score": 78.5, "weight": 40 },
    "Frontend": { "score": 71.2, "weight": 35 }
  },
  "explanation": "Le projet Migration Cloud maintient une météo NUAGE CLAIR (score 74.5/100). L'avancement global est bon (72%) mais l'écart budgétaire (8%) nécessite une attention."
}
```

### GET `/projects/{pid}/meteo/history`
Historique météo.
- **Query**: `?from=2026-01-01&to=2026-04-11`
- **Response 200**: List of MeteoHistory entries (for timeline chart)

### POST `/projects/{pid}/meteo/recalculate`
Forcer un recalcul météo (CHEF/DIRECTOR).
- **Response 200**: MeteoResponse

---

## 10. CQD (`/api/v1/projects/{pid}/cqd`)

### GET `/projects/{pid}/cqd/current`
État CQD actuel.
- **Response 200**:
```json
{
  "calculationDate": "2026-04-11",
  "cost": {
    "state": "ALIGNED",
    "variancePct": 4.2,
    "budgetConsumed": 175000,
    "budgetPlanned": 168000,
    "trend": "STABLE",
    "explanation": "Budget consommé à 4.2% au-dessus du prévu, dans les limites acceptables."
  },
  "quality": {
    "state": "ALIGNED",
    "score": 78,
    "trend": "IMPROVING",
    "explanation": "Score qualité en amélioration, couverture tests à 82%."
  },
  "delay": {
    "state": "UNDER_TENSION",
    "variancePct": -8.5,
    "plannedProgress": 42.0,
    "actualProgress": 38.4,
    "trend": "DETERIORATING",
    "explanation": "Retard de 8.5% par rapport au planning, en dégradation."
  }
}
```

### GET `/projects/{pid}/cqd/history`
Historique CQD.
- **Query**: `?from=2026-01-01&to=2026-04-11`

---

## 11. Corrective Actions (`/api/v1/projects/{pid}/corrective-actions`)

### GET `/projects/{pid}/corrective-actions`
Lister les actions correctives.
- **Query**: `?status=OPEN&priority=HIGH&indicatorId=uuid`

### POST `/projects/{pid}/corrective-actions`
Créer une action corrective.
- **Body**:
```json
{
  "title": "Renforcer l'équipe de test",
  "description": "Recruter 1 testeur senior pour améliorer la couverture",
  "indicatorId": "uuid",
  "blockedActionId": "uuid",
  "riskId": "uuid",
  "priority": "HIGH",
  "responsibleId": "uuid",
  "deadline": "2026-04-25",
  "expectedImpact": "Amélioration couverture tests de 60% à 80%"
}
```

### PUT `/projects/{pid}/corrective-actions/{id}`
Modifier une action corrective.

### PATCH `/projects/{pid}/corrective-actions/{id}/status`
Changer le statut.
- **Body**: `{ "status": "COMPLETED", "actualImpact": "Couverture passée à 82%" }`

---

## 12. Projections IA (`/api/v1/projects/{pid}/projections`)

### GET `/projects/{pid}/projections`
Obtenir les projections (génère si pas en cache).
- **Query**: `?horizon=14` (7, 14, 21, 30, 60)
- **Response 200**:
```json
{
  "projectionDate": "2026-04-11",
  "horizonDays": 14,
  "targetDate": "2026-04-25",
  "projectedMeteo": "NUAGE_CHARGE",
  "projectedScore": 66.3,
  "confidence": {
    "level": "HIGH",
    "percentage": 83.5
  },
  "componentScores": {
    "trend": { "score": 72.5, "confidence": 0.75, "weight": 0.30 },
    "simulation": { "score": 68.3, "confidence": 0.70, "weight": 0.25 },
    "actionPlan": { "score": 55.0, "confidence": 0.65, "weight": 0.20 },
    "risk": { "score": 62.0, "confidence": 0.70, "weight": 0.15 },
    "capacity": { "score": 72.0, "confidence": 0.60, "weight": 0.10 }
  },
  "projectedCQD": {
    "cost": "UNDER_TENSION",
    "quality": "ALIGNED",
    "delay": "UNDER_TENSION"
  },
  "scenarios": {
    "nominal": {
      "score": 66.3,
      "meteo": "NUAGE_CHARGE",
      "probability": 0.55,
      "assumptions": [
        "Vélocité constante",
        "Aucun nouveau risque matérialisé",
        "Actions correctives en cours produisent l'effet attendu"
      ]
    },
    "optimistic": {
      "score": 78.8,
      "meteo": "NUAGE_CLAIR",
      "probability": 0.25,
      "assumptions": [
        "Vélocité +15%",
        "Risques mitigés résolus",
        "Chemin critique non impacté"
      ]
    },
    "pessimistic": {
      "score": 48.1,
      "meteo": "ORAGE",
      "probability": 0.20,
      "assumptions": [
        "Risque majeur matérialisé",
        "Vélocité -20%",
        "Action du chemin critique bloquée"
      ]
    }
  },
  "keyFactors": [
    {
      "factor": "Actions bloquées sur chemin critique",
      "impact": "NEGATIVE",
      "weight": "HIGH",
      "details": "1 action bloquée depuis 3 jours"
    },
    {
      "factor": "Tendance indicateurs PROGRESS",
      "impact": "POSITIVE",
      "weight": "MEDIUM",
      "details": "3 indicateurs en amélioration"
    },
    {
      "factor": "Couverture actions correctives",
      "impact": "NEGATIVE",
      "weight": "MEDIUM",
      "details": "1 indicateur CRITICAL sans action corrective"
    }
  ],
  "recommendations": [
    {
      "priority": "CRITICAL",
      "category": "PLAN",
      "title": "Débloquer l'action 'Migration DB'",
      "description": "Action bloquée depuis 3 jours sur le chemin critique.",
      "expectedImpact": "+10 à +15 pts",
      "effort": "IMMEDIATE"
    },
    {
      "priority": "HIGH",
      "category": "INDICATOR",
      "title": "Créer action corrective pour RSK-002",
      "description": "Indicateur en état CRITICAL sans plan d'action.",
      "expectedImpact": "Évite forçage ORAGE (R23)",
      "effort": "SHORT_TERM"
    }
  ],
  "explanation": "⚠️ Le projet Migration Cloud risque de se dégrader vers NUAGE CHARGÉ (score 66.3/100) à J+14. Le principal facteur est le blocage d'une action sur le chemin critique. Cependant, la tendance globale est positive avec 3 indicateurs en amélioration. Actions recommandées : débloquer la migration DB et créer une action corrective pour l'indicateur RSK-002."
}
```

### GET `/projects/{pid}/projections/history`
Historique des projections passées avec score de précision.
- **Query**: `?horizon=14&from=2026-01-01`

### GET `/projects/{pid}/projections/accuracy`
Métriques de précision du moteur IA.
- **Response 200**:
```json
{
  "totalProjections": 45,
  "evaluatedProjections": 32,
  "meanAbsoluteError": 8.3,
  "accuracyRate": 0.78,
  "stateMatchRate": 0.72,
  "byHorizon": {
    "7": { "mae": 5.1, "accuracy": 0.88, "stateMatch": 0.85 },
    "14": { "mae": 8.3, "accuracy": 0.78, "stateMatch": 0.72 },
    "21": { "mae": 12.1, "accuracy": 0.65, "stateMatch": 0.58 }
  }
}
```

---

## 13. Risks (`/api/v1/projects/{pid}/risks`)

### GET `/projects/{pid}/risks`
Lister les risques.
- **Query**: `?status=IDENTIFIED&category=TECHNICAL&sortBy=severity&order=desc`

### GET `/projects/{pid}/risks/matrix`
Données pour la matrice des risques (Probabilité × Impact).
- **Response 200**:
```json
{
  "risks": [
    {
      "id": "uuid",
      "title": "Départ développeur senior",
      "probability": 60,
      "impact": 80,
      "severity": 48,
      "status": "MITIGATING",
      "category": "RESOURCE"
    }
  ],
  "summary": {
    "total": 8,
    "critical": 2,
    "high": 3,
    "medium": 2,
    "low": 1,
    "averageSeverity": 38.5,
    "mitigationCoverage": 0.75
  }
}
```

### POST `/projects/{pid}/risks`
Créer un risque.

### PUT `/projects/{pid}/risks/{id}`
Modifier un risque.

### PATCH `/projects/{pid}/risks/{id}/materialize`
Matérialiser un risque.

### PATCH `/projects/{pid}/risks/{id}/close`
Clôturer un risque.

---

## 14. Dashboard (`/api/v1/dashboard`)

### GET `/dashboard`
Dashboard global de l'utilisateur connecté.
- **Response 200**:
```json
{
  "projectsCount": 5,
  "projectsByMeteo": {
    "SOLEIL": 1,
    "NUAGE_CLAIR": 2,
    "NUAGE_CHARGE": 1,
    "ORAGE": 1
  },
  "alerts": [
    {
      "type": "BLOCKED_ACTION",
      "severity": "HIGH",
      "projectId": "uuid",
      "projectName": "Migration Cloud",
      "message": "Action 'Migration DB' bloquée depuis 5 jours",
      "createdAt": "2026-04-06T10:00:00Z"
    }
  ],
  "projects": [ /* ProjectSummaryResponse[] */ ],
  "kpis": {
    "avgScore": 72.3,
    "projectsOnTrack": 3,
    "projectsAtRisk": 2,
    "totalBudget": 2500000,
    "totalConsumed": 875000,
    "overallBudgetVariance": 3.2
  }
}
```

### GET `/dashboard/compare`
Comparer des projets.
- **Query**: `?projectIds=uuid1,uuid2,uuid3`

---

## 15. Exports (`/api/v1/exports`)

### POST `/exports/pdf`
Générer un rapport PDF.
- **Body**: `{ "projectId": "uuid", "sections": ["meteo", "cqd", "plan", "risks", "projections"] }`
- **Response 200**: Binary PDF file
- **Headers**: `Content-Type: application/pdf`

### POST `/exports/excel`
Générer un export Excel.
- **Body**: `{ "projectId": "uuid", "sections": ["indicators", "actions", "risks"] }`
- **Response 200**: Binary XLSX file

---

## 16. Admin (`/api/v1/admin`)

### GET `/admin/audit-log`
Consulter les logs d'audit (ADMIN only).
- **Query**: `?userId=uuid&projectId=uuid&action=CREATE&from=2026-04-01&page=0&size=50`

### GET `/admin/stats`
Statistiques système.
- **Response 200**:
```json
{
  "totalUsers": 45,
  "activeUsers": 38,
  "totalProjects": 12,
  "activeProjects": 8,
  "totalActions": 342,
  "totalIndicatorValues": 1256,
  "totalProjections": 89,
  "projectionAccuracy": 0.78
}
```

---

## 17. Error Response Format

All errors follow this format:
```json
{
  "timestamp": "2026-04-11T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "L'avancement doit être entre 0 et 100",
  "details": {
    "field": "progress",
    "rejectedValue": 150,
    "rule": "R1"
  },
  "path": "/api/v1/projects/123/actions/456"
}
```

### Error Codes
| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Champ invalide |
| `BUSINESS_RULE_VIOLATION` | Règle métier violée (R1-R24) |
| `RESOURCE_NOT_FOUND` | Ressource introuvable |
| `UNAUTHORIZED` | Non authentifié |
| `FORBIDDEN` | Non autorisé (rôle insuffisant) |
| `CONFLICT` | Conflit (doublon, dépendance circulaire) |
| `RATE_LIMITED` | Trop de requêtes |
| `INTERNAL_ERROR` | Erreur serveur |
