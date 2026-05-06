# BACKLOG - USER STORIES

## Légende Priorité
- **MUST** : Indispensable pour le MVP
- **SHOULD** : Important, à inclure si possible
- **NICE** : Bonus, si le temps le permet

---

## 1. AUTHENTIFICATION & GESTION UTILISATEURS

| ID | User Story | Priorité | Points |
|----|-----------|----------|--------|
| US-001 | En tant qu'utilisateur, je veux me connecter avec email/mot de passe pour accéder à l'application | MUST | 5 |
| US-002 | En tant qu'utilisateur, je veux me déconnecter pour sécuriser mon accès | MUST | 2 |
| US-003 | En tant qu'utilisateur, je veux réinitialiser mon mot de passe en cas d'oubli | MUST | 5 |
| US-004 | En tant qu'utilisateur, je veux consulter et modifier mon profil | MUST | 3 |
| US-005 | En tant qu'administrateur, je veux créer/modifier/désactiver des utilisateurs | MUST | 5 |
| US-006 | En tant qu'administrateur, je veux attribuer des rôles par projet | MUST | 5 |
| US-007 | En tant que système, je veux verrouiller un compte après 5 tentatives échouées | MUST | 3 |
| US-008 | En tant que système, je veux rafraîchir automatiquement le token JWT | MUST | 3 |

**Sous-total : 31 points, 8 stories**

### Critères d'acceptation US-001 :
- [ ] L'utilisateur saisit email + mot de passe
- [ ] Le système retourne un JWT (access 1h + refresh 7j)
- [ ] Les tokens sont stockés en mémoire (pas localStorage)
- [ ] En cas d'erreur, un message clair est affiché
- [ ] Après 5 échecs, le compte est verrouillé 30 min
- [ ] L'audit log enregistre la connexion

---

## 2. GESTION DES PROJETS

| ID | User Story | Priorité | Points |
|----|-----------|----------|--------|
| US-010 | En tant que directeur, je veux créer un projet avec ses informations de base | MUST | 5 |
| US-011 | En tant que directeur/chef, je veux configurer un projet (type, criticité, visibilité) | MUST | 3 |
| US-012 | En tant que directeur, je veux définir les modules du projet avec leur pondération | MUST | 5 |
| US-013 | En tant que directeur/chef, je veux sélectionner les indicateurs depuis la bibliothèque | MUST | 5 |
| US-014 | En tant que chef de projet, je veux configurer les seuils des indicateurs pour mon projet | MUST | 3 |
| US-015 | En tant que directeur, je veux affecter l'équipe au projet avec des rôles | MUST | 3 |
| US-016 | En tant que sponsor, je veux valider le périmètre pour lancer le projet | MUST | 3 |
| US-017 | En tant que directeur, je veux archiver un projet terminé | SHOULD | 2 |
| US-018 | En tant qu'utilisateur, je veux consulter la liste de mes projets avec filtres | MUST | 3 |
| US-019 | En tant que chef, je veux mettre à jour le budget consommé | MUST | 2 |

**Sous-total : 34 points, 10 stories**

### Critères d'acceptation US-012 :
- [ ] Le directeur peut ajouter N modules au projet
- [ ] Chaque module a un nom, description, poids (0-100), responsable
- [ ] La somme des poids ne dépasse pas 100
- [ ] Les modules sont ordonnables par drag & drop
- [ ] La suppression d'un module cascade sur ses actions

---

## 3. PLAN PROJET

| ID | User Story | Priorité | Points |
|----|-----------|----------|--------|
| US-020 | En tant que directeur/chef, je veux créer une action dans un module | MUST | 3 |
| US-021 | En tant que directeur/chef, je veux modifier/supprimer une action | MUST | 3 |
| US-022 | En tant que directeur/chef, je veux définir les dépendances entre actions (FS/SS/FF/SF) | MUST | 5 |
| US-023 | En tant que système, je veux détecter les dépendances circulaires et les bloquer | MUST | 5 |
| US-024 | En tant que membre/chef, je veux mettre à jour l'avancement d'une action (0-100%) | MUST | 3 |
| US-025 | En tant que membre/chef, je veux déclarer une action comme bloquée avec raison et type | MUST | 3 |
| US-026 | En tant que chef, je veux débloquer une action | MUST | 2 |
| US-027 | En tant que système, je veux calculer l'avancement global pondéré (R10) | MUST | 5 |
| US-028 | En tant que système, je veux détecter les actions en retard | MUST | 3 |
| US-029 | En tant que système, je veux alerter quand une action est bloquée > 5 jours (R20) | MUST | 3 |
| US-030 | En tant qu'utilisateur, je veux consulter le plan projet sous forme de tableau | MUST | 3 |
| US-031 | En tant qu'utilisateur, je veux visualiser le diagramme de Gantt | SHOULD | 8 |
| US-032 | En tant qu'utilisateur, je veux visualiser le chemin critique | SHOULD | 5 |

**Sous-total : 51 points, 13 stories**

### Critères d'acceptation US-024 :
- [ ] L'avancement est un entier entre 0 et 100 (R1)
- [ ] La mise à jour déclenche le recalcul de l'avancement module
- [ ] La mise à jour déclenche le recalcul de la météo (async)
- [ ] Si progress = 100, le statut passe à COMPLETED
- [ ] L'audit log enregistre le changement

---

## 4. INDICATEURS

| ID | User Story | Priorité | Points |
|----|-----------|----------|--------|
| US-040 | En tant que chef, je veux saisir les valeurs des indicateurs selon la fréquence | MUST | 5 |
| US-041 | En tant que système, je veux calculer le score d'un indicateur (0-100) selon les seuils (R11) | MUST | 5 |
| US-042 | En tant que système, je veux gérer les indicateurs inversés (plus bas = mieux) | MUST | 3 |
| US-043 | En tant qu'utilisateur, je veux consulter l'état de tous les indicateurs d'un projet | MUST | 3 |
| US-044 | En tant qu'utilisateur, je veux consulter l'historique d'un indicateur (graphique) | MUST | 5 |
| US-045 | En tant que chef, je veux configurer les alertes par indicateur | SHOULD | 3 |
| US-046 | En tant qu'administrateur, je veux gérer la bibliothèque d'indicateurs | SHOULD | 5 |
| US-047 | En tant qu'utilisateur, je veux voir la tendance d'un indicateur (improving/stable/deteriorating) | MUST | 3 |

**Sous-total : 32 points, 8 stories**

---

## 5. MOTEUR MÉTÉO

| ID | User Story | Priorité | Points |
|----|-----------|----------|--------|
| US-050 | En tant que système, je veux pondérer les indicateurs avec poids × coefficient criticité (R12) | MUST | 5 |
| US-051 | En tant que système, je veux agréger les scores par module (R13) | MUST | 3 |
| US-052 | En tant que système, je veux agréger le score projet global (R14) | MUST | 3 |
| US-053 | En tant que système, je veux convertir le score en état météo (SOLEIL/NUAGE_CLAIR/NUAGE_CHARGE/ORAGE) | MUST | 2 |
| US-054 | En tant que système, je veux appliquer les 5 règles de forçage ORAGE (R20-R24) | MUST | 8 |
| US-055 | En tant que système, je veux générer une explication en langage naturel | MUST | 5 |
| US-056 | En tant qu'utilisateur, je veux consulter la météo actuelle avec explication | MUST | 3 |
| US-057 | En tant qu'utilisateur, je veux consulter l'historique météo (timeline) | MUST | 5 |
| US-058 | En tant qu'utilisateur, je veux voir le détail du score (breakdown par indicateur) | MUST | 3 |

**Sous-total : 37 points, 9 stories**

### Critères d'acceptation US-054 :
- [ ] R20 : ≥1 action bloquée > 5 jours → ORAGE
- [ ] R21 : ≥30% des actions en retard → ORAGE
- [ ] R22 : Budget consommé > 120% du prévu → ORAGE
- [ ] R23 : ≥1 indicateur CRITICAL sans action corrective → ORAGE
- [ ] R24 : Aucune mise à jour depuis > 10 jours → ORAGE
- [ ] Les règles actives sont enregistrées dans l'historique
- [ ] L'explication mentionne les règles de forçage déclenchées

---

## 6. TRIPTYQUE CQD

| ID | User Story | Priorité | Points |
|----|-----------|----------|--------|
| US-060 | En tant que système, je veux calculer l'écart coût (consommé vs prévu à date) | MUST | 5 |
| US-061 | En tant que système, je veux calculer le score qualité (moyenne indicateurs QUALITY) | MUST | 3 |
| US-062 | En tant que système, je veux calculer l'écart délai (avancement réel vs prévu) | MUST | 5 |
| US-063 | En tant que système, je veux déterminer l'état C/Q/D (ALIGNED/UNDER_TENSION/DEGRADED) | MUST | 3 |
| US-064 | En tant que système, je veux calculer les tendances (3 dernières mesures) | MUST | 3 |
| US-065 | En tant qu'utilisateur, je veux consulter le triptyque CQD | MUST | 5 |
| US-066 | En tant qu'utilisateur, je veux consulter l'historique CQD | SHOULD | 3 |
| US-067 | En tant que chef/directeur, je veux exporter le CQD | SHOULD | 3 |

**Sous-total : 30 points, 8 stories**

---

## 7. ACTIONS CORRECTIVES

| ID | User Story | Priorité | Points |
|----|-----------|----------|--------|
| US-070 | En tant que chef, je veux créer une action corrective liée à un indicateur | MUST | 5 |
| US-071 | En tant que chef, je veux lier une action corrective à une action bloquée | MUST | 3 |
| US-072 | En tant que chef, je veux lier une action corrective à un risque | SHOULD | 2 |
| US-073 | En tant que chef, je veux affecter un responsable et une échéance | MUST | 2 |
| US-074 | En tant que membre/chef, je veux mettre à jour le statut d'une action corrective | MUST | 2 |
| US-075 | En tant qu'utilisateur, je veux consulter le plan d'action (liste + filtres) | MUST | 3 |
| US-076 | En tant que système, je veux détecter les indicateurs CRITICAL sans action corrective (R23) | MUST | 3 |
| US-077 | En tant que chef, je veux suivre l'efficacité d'une action corrective (impact réel) | SHOULD | 3 |

**Sous-total : 23 points, 8 stories**

---

## 8. GESTION DES RISQUES

| ID | User Story | Priorité | Points |
|----|-----------|----------|--------|
| US-080 | En tant que chef/directeur, je veux créer un risque (titre, catégorie, P, I) | MUST | 3 |
| US-081 | En tant que système, je veux calculer la sévérité (P × I / 100) automatiquement | MUST | 2 |
| US-082 | En tant que chef, je veux définir un plan de mitigation et contingence | MUST | 3 |
| US-083 | En tant que chef, je veux matérialiser ou clôturer un risque | MUST | 2 |
| US-084 | En tant qu'utilisateur, je veux visualiser la matrice des risques (P × I) | MUST | 5 |
| US-085 | En tant que chef, je veux lier un risque à une action corrective | SHOULD | 2 |

**Sous-total : 17 points, 6 stories**

---

## 9. MODULE IA - PROJECTIONS

| ID | User Story | Priorité | Points |
|----|-----------|----------|--------|
| US-090 | En tant que système, je veux analyser les tendances des indicateurs (WMA + régression) | MUST | 8 |
| US-091 | En tant que système, je veux simuler le plan projet (Monte Carlo ×100) | MUST | 8 |
| US-092 | En tant que système, je veux évaluer l'efficacité du plan d'action | MUST | 5 |
| US-093 | En tant que système, je veux intégrer les risques dans la projection | MUST | 5 |
| US-094 | En tant que système, je veux analyser la capacité de l'équipe | MUST | 5 |
| US-095 | En tant que système, je veux composer la projection finale (5 couches pondérées) | MUST | 5 |
| US-096 | En tant que système, je veux calculer le niveau de confiance (HIGH/MEDIUM/LOW) | MUST | 5 |
| US-097 | En tant que système, je veux générer 3 scénarios (nominal/optimiste/pessimiste) | MUST | 5 |
| US-098 | En tant que système, je veux générer des recommandations actionnables (top 5) | MUST | 5 |
| US-099 | En tant que système, je veux générer des explications en français | MUST | 5 |
| US-100 | En tant qu'utilisateur, je veux consulter les projections (par horizon J+7/14/21/30/60) | MUST | 5 |
| US-101 | En tant qu'utilisateur, je veux voir la comparaison des 3 scénarios | MUST | 3 |
| US-102 | En tant qu'utilisateur, je veux voir le radar des composantes IA | MUST | 3 |
| US-103 | En tant que système, je veux tracker la précision des projections passées | SHOULD | 5 |
| US-104 | En tant qu'utilisateur, je veux consulter les métriques de précision de l'IA | SHOULD | 3 |
| US-105 | En tant que système, je veux générer des données synthétiques pour tester l'IA | SHOULD | 5 |

**Sous-total : 85 points, 16 stories**

### Critères d'acceptation US-095 :
- [ ] La composition utilise : 30% Trend + 25% Simulation + 20% ActionPlan + 15% Risk + 10% Capacity
- [ ] Le score final est entre 0 et 100
- [ ] Le score est converti en MeteoState
- [ ] Le CQD est projeté en parallèle
- [ ] Le résultat est sauvegardé en base et mis en cache (15 min)
- [ ] Le temps de calcul est < 5 secondes

---

## 10. DASHBOARD & REPORTING

| ID | User Story | Priorité | Points |
|----|-----------|----------|--------|
| US-110 | En tant qu'utilisateur, je veux voir un tableau de bord global avec mes projets | MUST | 8 |
| US-111 | En tant qu'utilisateur, je veux voir un résumé météo de tous mes projets | MUST | 3 |
| US-112 | En tant qu'utilisateur, je veux filtrer par projet/date/statut | MUST | 3 |
| US-113 | En tant que directeur, je veux comparer plusieurs projets side-by-side | SHOULD | 5 |
| US-114 | En tant que directeur, je veux voir les KPIs globaux | SHOULD | 3 |
| US-115 | En tant que chef/directeur, je veux exporter un rapport PDF | MUST | 8 |
| US-116 | En tant que chef/directeur, je veux exporter les données en Excel | SHOULD | 5 |
| US-117 | En tant que directeur, je veux planifier des exports automatiques | NICE | 5 |
| US-118 | En tant qu'utilisateur, je veux voir les alertes actives | MUST | 3 |

**Sous-total : 43 points, 9 stories**

---

## 11. ADMINISTRATION & AUDIT

| ID | User Story | Priorité | Points |
|----|-----------|----------|--------|
| US-120 | En tant qu'administrateur, je veux consulter les logs d'audit | MUST | 5 |
| US-121 | En tant qu'administrateur, je veux voir les statistiques système | SHOULD | 3 |
| US-122 | En tant que système, je veux enregistrer chaque action sensible dans l'audit log | MUST | 5 |
| US-123 | En tant qu'administrateur, je veux filtrer les logs par utilisateur/projet/action/date | MUST | 3 |

**Sous-total : 16 points, 4 stories**

---

## RÉSUMÉ

| Catégorie | Stories | Points | MUST | SHOULD | NICE |
|-----------|---------|--------|------|--------|------|
| Auth & Users | 8 | 31 | 8 | 0 | 0 |
| Projets | 10 | 34 | 9 | 1 | 0 |
| Plan Projet | 13 | 51 | 11 | 2 | 0 |
| Indicateurs | 8 | 32 | 6 | 2 | 0 |
| Météo | 9 | 37 | 9 | 0 | 0 |
| CQD | 8 | 30 | 6 | 2 | 0 |
| Actions Correctives | 8 | 23 | 6 | 2 | 0 |
| Risques | 6 | 17 | 5 | 1 | 0 |
| IA Projections | 16 | 85 | 13 | 3 | 0 |
| Dashboard | 9 | 43 | 5 | 3 | 1 |
| Admin & Audit | 4 | 16 | 3 | 1 | 0 |
| **TOTAL** | **99** | **399** | **81** | **17** | **1** |
