# SPRINT PLANNING - MÉTÉO PROJET v2.0

## Paramètres
- **Durée sprint** : 2 semaines
- **Capacité** : 5 jours/sprint (mi-temps)
- **Vélocité estimée** : 25-35 points/sprint
- **Nombre de sprints** : 13 (Février → Juillet 2026)
- **Équipe** : 1 développeur full-stack

---

## SPRINT 1 (16 Fév - 01 Mar 2026) — FONDATIONS
**Objectif** : Setup complet du projet + Authentification

| US | Description | Points |
|----|------------|--------|
| - | Setup Spring Boot 3.2, PostgreSQL, Flyway, Docker Compose | 5 |
| - | Setup Angular 17, Material, NgRx, routing | 5 |
| US-001 | Login (email/password → JWT) | 5 |
| US-002 | Logout | 2 |
| US-008 | Refresh token automatique | 3 |
| US-007 | Verrouillage compte après 5 échecs | 3 |
| - | JWT Interceptor + Error Interceptor Angular | 3 |

**Total : ~26 points**
**Milestone : M1 - Foundation**

**Livrables :**
- Docker Compose (PostgreSQL + Redis + Spring Boot)
- V1__initial_schema.sql (Flyway)
- Login/Logout fonctionnel avec JWT
- Layout principal Angular (sidebar, header)

---

## SPRINT 2 (02 Mar - 15 Mar 2026) — UTILISATEURS & PROJETS
**Objectif** : Gestion utilisateurs + CRUD projets

| US | Description | Points |
|----|------------|--------|
| US-003 | Reset password | 5 |
| US-004 | Profil utilisateur | 3 |
| US-005 | CRUD utilisateurs (admin) | 5 |
| US-006 | Attribution rôles par projet | 5 |
| US-010 | Créer projet | 5 |
| US-011 | Configurer projet | 3 |
| US-018 | Liste projets + filtres | 3 |

**Total : ~29 points**

---

## SPRINT 3 (16 Mar - 29 Mar 2026) — MODULES & ACTIONS
**Objectif** : Plan projet de base

| US | Description | Points |
|----|------------|--------|
| US-012 | Définir modules + pondération | 5 |
| US-015 | Affecter équipe au projet | 3 |
| US-020 | Créer action dans un module | 3 |
| US-021 | Modifier/supprimer action | 3 |
| US-024 | Mettre à jour avancement (0-100%) | 3 |
| US-025 | Déclarer blocage (raison + type) | 3 |
| US-026 | Débloquer action | 2 |
| US-030 | Vue tableau du plan projet | 3 |
| US-027 | Calcul avancement global pondéré (R10) | 5 |

**Total : ~30 points**
**Milestone : M2 - Core Features**

---

## SPRINT 4 (30 Mar - 12 Avr 2026) — DÉPENDANCES & INDICATEURS
**Objectif** : Dépendances entre actions + début indicateurs

| US | Description | Points |
|----|------------|--------|
| US-022 | Dépendances entre actions (FS/SS/FF/SF) | 5 |
| US-023 | Détection dépendances circulaires | 5 |
| US-028 | Détection actions en retard | 3 |
| US-013 | Sélectionner indicateurs depuis bibliothèque | 5 |
| US-014 | Configurer seuils par projet | 3 |
| US-040 | Saisir valeurs indicateurs | 5 |
| US-041 | Calculer score indicateur (R11) | 5 |

**Total : ~31 points**

---

## SPRINT 5 (13 Avr - 26 Avr 2026) — MOTEUR MÉTÉO
**Objectif** : Le coeur du système - calcul météo complet

| US | Description | Points |
|----|------------|--------|
| US-042 | Gestion indicateurs inversés | 3 |
| US-043 | Dashboard indicateurs | 3 |
| US-044 | Historique indicateur (graphique) | 5 |
| US-047 | Tendance indicateur | 3 |
| US-050 | Pondération indicateurs (R12) | 5 |
| US-051 | Agrégation par module (R13) | 3 |
| US-052 | Agrégation projet (R14) | 3 |
| US-053 | Conversion score → météo | 2 |
| US-055 | Génération explications NL | 5 |

**Total : ~32 points**
**Milestone : M3 - Business Logic**

---

## SPRINT 6 (27 Avr - 10 Mai 2026) — FORÇAGE & CQD
**Objectif** : Règles de forçage ORAGE + triptyque CQD

| US | Description | Points |
|----|------------|--------|
| US-054 | 5 règles de forçage ORAGE (R20-R24) | 8 |
| US-029 | Alerte actions bloquées > 5j | 3 |
| US-056 | Consulter météo + explication | 3 |
| US-057 | Historique météo (timeline) | 5 |
| US-058 | Breakdown score par indicateur | 3 |
| US-060 | Calcul écart coût | 5 |
| US-061 | Calcul score qualité | 3 |

**Total : ~30 points**

---

## SPRINT 7 (11 Mai - 24 Mai 2026) — CQD COMPLET & RISQUES
**Objectif** : Finaliser CQD + gestion risques

| US | Description | Points |
|----|------------|--------|
| US-062 | Calcul écart délai | 5 |
| US-063 | Détermination états C/Q/D | 3 |
| US-064 | Calcul tendances | 3 |
| US-065 | Vue triptyque CQD | 5 |
| US-080 | Créer risque | 3 |
| US-081 | Calcul sévérité auto | 2 |
| US-082 | Plan mitigation/contingence | 3 |
| US-083 | Matérialiser/clôturer risque | 2 |
| US-084 | Matrice des risques | 5 |

**Total : ~31 points**

---

## SPRINT 8 (25 Mai - 07 Jun 2026) — ACTIONS CORRECTIVES & IA LAYER 1-2
**Objectif** : Actions correctives + début moteur IA

| US | Description | Points |
|----|------------|--------|
| US-070 | Créer action corrective liée indicateur | 5 |
| US-073 | Affecter responsable + échéance | 2 |
| US-074 | MAJ statut action corrective | 2 |
| US-075 | Vue plan d'action | 3 |
| US-076 | Détection CRITICAL sans action (R23) | 3 |
| US-090 | IA Layer 1: Trend Analysis (WMA + régression) | 8 |
| US-091 | IA Layer 2: Plan Simulation (Monte Carlo) | 8 |

**Total : ~31 points**
**Milestone : M4 - IA Foundation**

---

## SPRINT 9 (08 Jun - 21 Jun 2026) — IA LAYERS 3-5 & COMPOSITION
**Objectif** : Finaliser les 5 couches IA + composition

| US | Description | Points |
|----|------------|--------|
| US-092 | IA Layer 3: Action Plan Evaluator | 5 |
| US-093 | IA Layer 4: Risk Integrator | 5 |
| US-094 | IA Layer 5: Capacity Analyzer | 5 |
| US-095 | Projection Compositor (pondération 5 couches) | 5 |
| US-096 | Calcul confiance (HIGH/MEDIUM/LOW) | 5 |
| US-097 | Génération 3 scénarios | 5 |

**Total : ~30 points**

---

## SPRINT 10 (22 Jun - 05 Jul 2026) — IA UI & RECOMMANDATIONS
**Objectif** : Interface IA complète + dashboard

| US | Description | Points |
|----|------------|--------|
| US-098 | Recommandations actionnables (top 5) | 5 |
| US-099 | Explications IA en français | 5 |
| US-100 | Vue projections par horizon | 5 |
| US-101 | Comparaison 3 scénarios | 3 |
| US-102 | Radar composantes IA | 3 |
| US-110 | Dashboard global | 8 |

**Total : ~29 points**
**Milestone : M5 - MVP**

---

## SPRINT 11 (06 Jul - 19 Jul 2026) — DASHBOARD & EXPORTS
**Objectif** : Dashboard complet + exports

| US | Description | Points |
|----|------------|--------|
| US-111 | Résumé météo multi-projets | 3 |
| US-112 | Filtres dashboard | 3 |
| US-118 | Alertes actives | 3 |
| US-115 | Export PDF | 8 |
| US-019 | MAJ budget consommé | 2 |
| US-016 | Validation périmètre | 3 |
| US-120 | Audit log | 5 |
| US-122 | Enregistrement actions audit | 5 |

**Total : ~32 points**

---

## SPRINT 12 (20 Jul - 02 Août 2026) — POLISH & SHOULD
**Objectif** : Features SHOULD + polish

| US | Description | Points |
|----|------------|--------|
| US-031 | Diagramme de Gantt | 8 |
| US-032 | Chemin critique | 5 |
| US-066 | Historique CQD | 3 |
| US-071 | Lier action corrective à action bloquée | 3 |
| US-046 | Gestion bibliothèque indicateurs | 5 |
| US-113 | Comparaison projets side-by-side | 5 |
| US-103 | Accuracy tracking IA | 5 |

**Total : ~34 points**

---

## SPRINT 13 (03 Août - 16 Août 2026) — FINALISATION
**Objectif** : Dernières features + tests + déploiement

| US | Description | Points |
|----|------------|--------|
| US-116 | Export Excel | 5 |
| US-017 | Archivage projet | 2 |
| US-077 | Suivi efficacité actions correctives | 3 |
| US-104 | Métriques précision IA | 3 |
| US-121 | Statistiques système | 3 |
| US-105 | Données synthétiques IA | 5 |
| - | Tests E2E complets | 5 |
| - | Documentation finale | 3 |
| - | Optimisation performance | 3 |

**Total : ~32 points**
**Milestone : M6 - Production Ready**

---

## BURNDOWN CHART (estimé)

```
Points │
  400  │ ●
       │   ●
  350  │     ●
       │       ●
  300  │         ●
       │           ●
  250  │             ●
       │               ●
  200  │                 ●
       │                   ●
  150  │                     ●
       │                       ●
  100  │                         ●
       │                           ●
   50  │                             ●
       │                               ●
    0  │─────────────────────────────────●
       S1  S2  S3  S4  S5  S6  S7  S8  S9  S10 S11 S12 S13
```

## MILESTONES

| # | Milestone | Sprint | Date | Stories complétées |
|---|-----------|--------|------|-------------------|
| M1 | Foundation | S1 | 01 Mar 2026 | Auth + Setup |
| M2 | Core Features | S3 | 29 Mar 2026 | Projects + Plan |
| M3 | Business Logic | S5 | 26 Avr 2026 | Indicateurs + Météo |
| M4 | IA Foundation | S8 | 07 Jun 2026 | Actions Correctives + IA L1-L2 |
| M5 | MVP | S10 | 05 Jul 2026 | IA Complet + Dashboard |
| M6 | Production | S13 | 16 Août 2026 | Tout finalisé |
