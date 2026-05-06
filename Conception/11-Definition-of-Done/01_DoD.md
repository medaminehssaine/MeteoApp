# DEFINITION OF DONE (DoD)

## 1. Code

- [ ] Le code compile sans erreur
- [ ] Le code respecte les conventions du projet (Java: Google Style, Angular: ESLint Angular)
- [ ] Pas de TODO ou FIXME restants dans le code livré
- [ ] Pas de code commenté inutile
- [ ] Pas de console.log / System.out.println en production
- [ ] Les imports inutilisés sont supprimés
- [ ] Pas de duplication de code (DRY)

## 2. Tests

### Backend (Spring Boot)
- [ ] Tests unitaires écrits pour tout nouveau service
- [ ] Couverture tests unitaires ≥ 70% sur le code modifié
- [ ] Tests d'intégration pour les endpoints API (MockMvc)
- [ ] Tests de repository avec Testcontainers (PostgreSQL)
- [ ] Tous les tests passent (0 failure, 0 error)

### Frontend (Angular)
- [ ] Tests unitaires pour les composants et services critiques
- [ ] Tests d'intégration pour les stores NgRx
- [ ] Couverture ≥ 60% sur le code modifié
- [ ] Tous les tests passent

### Niveaux de test
| Type | Couverture cible | Outil |
|------|-----------------|-------|
| Unit tests backend | ≥ 70% | JUnit 5 + Mockito |
| Integration tests backend | ≥ 50% | Testcontainers + MockMvc |
| Unit tests frontend | ≥ 60% | Jest |
| E2E tests | Chemins critiques | Cypress |

## 3. Sécurité

- [ ] Pas de vulnérabilité OWASP Top 10
- [ ] Les endpoints sont protégés par JWT
- [ ] Les rôles RBAC sont vérifiés (annotation @RequiresProjectRole)
- [ ] Les inputs sont validés (Jakarta Validation)
- [ ] Pas d'injection SQL (utilisation de JPA parameterized queries)
- [ ] Pas de XSS (Angular sanitization par défaut)
- [ ] Les mots de passe sont hashés BCrypt (cost 12)
- [ ] Les données sensibles ne sont pas loggées
- [ ] CORS configuré strictement

## 4. Performance

| Métrique | Cible | Mesure |
|----------|-------|--------|
| Temps chargement page | < 2s | Lighthouse |
| Temps réponse API (P95) | < 500ms | Spring Actuator |
| Calcul météo | < 3s | Test chronométré |
| Projection IA | < 5s | Test chronométré |
| Export PDF | < 10s | Test chronométré |
| First Contentful Paint | < 1.5s | Lighthouse |
| Bundle size (initial) | < 500KB | ng build --stats |

## 5. UI/UX

- [ ] L'interface est responsive (desktop + tablette)
- [ ] Les couleurs respectent le thème météo défini
- [ ] Les états de chargement sont gérés (spinner/skeleton)
- [ ] Les erreurs sont affichées clairement à l'utilisateur
- [ ] Les formulaires ont une validation côté client
- [ ] Les actions destructives demandent confirmation
- [ ] La navigation est intuitive et cohérente
- [ ] Les icônes météo sont correctement affichées

## 6. API

- [ ] L'endpoint respecte les conventions REST
- [ ] Les DTOs request/response sont documentés
- [ ] La validation des inputs retourne des messages clairs
- [ ] Les erreurs suivent le format ErrorResponse standard
- [ ] Les codes HTTP sont corrects (200/201/204/400/401/403/404/409/429/500)
- [ ] L'endpoint est documenté dans Swagger (OpenAPI)
- [ ] Pagination sur les listes (Page<T>)

## 7. Base de Données

- [ ] Les changements de schéma passent par Flyway (migration SQL)
- [ ] Les index sont créés pour les colonnes fréquemment filtrées/triées
- [ ] Les contraintes d'intégrité sont en place (FK, UK, CHECK)
- [ ] Les requêtes complexes sont optimisées (EXPLAIN ANALYZE)
- [ ] Pas de N+1 queries (vérifier avec Hibernate logging)

## 8. Documentation

- [ ] Le code est auto-documenté (noms de variables/méthodes explicites)
- [ ] Les algorithmes complexes sont commentés (ex: formules météo, IA)
- [ ] Les endpoints API sont documentés via annotations OpenAPI
- [ ] Le README est à jour si nécessaire

## 9. Git & Version Control

- [ ] La branche est créée depuis `develop` (Git Flow)
- [ ] Les commits sont atomiques et avec messages clairs
- [ ] Convention de commits : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`
- [ ] La branche est rebasée sur `develop` avant merge
- [ ] Pas de fichiers sensibles (.env, credentials) dans le commit
- [ ] Le .gitignore est correctement configuré

## 10. Déploiement

- [ ] Le build Docker passe sans erreur
- [ ] L'application démarre correctement avec Docker Compose
- [ ] Les migrations Flyway s'exécutent automatiquement
- [ ] Les health checks Actuator répondent OK
- [ ] Les variables d'environnement sont externalisées

## 11. Acceptance

- [ ] La fonctionnalité correspond à la user story
- [ ] Tous les critères d'acceptation de la US sont validés
- [ ] Pas de régression sur les fonctionnalités existantes
- [ ] L'audit log enregistre les actions sensibles

---

## Checklist Résumé (Par US)

```
□ Code compile et respecte les conventions
□ Tests unitaires écrits et passent (≥ 70% backend, ≥ 60% frontend)
□ Sécurité : JWT + RBAC + validation inputs
□ Performance : dans les limites définies
□ UI/UX : responsive, loading states, error handling
□ API : REST conventions, Swagger doc, error format
□ DB : Flyway migration, indexes, constraints
□ Git : commits propres, branche rebasée
□ Docker : build OK, health check OK
□ Critères d'acceptation : tous validés
```
