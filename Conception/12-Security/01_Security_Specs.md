# SPÉCIFICATIONS DE SÉCURITÉ

## 1. Authentification

### 1.1 JWT (JSON Web Token)
```
Access Token:
  - Algorithme : HS256
  - Durée : 1 heure
  - Payload : { sub: userId, email, role, iat, exp }
  - Stockage : Mémoire JavaScript (PAS localStorage/sessionStorage)

Refresh Token:
  - Durée : 7 jours
  - Stockage : Base de données (table refresh_tokens)
  - Rotation : nouveau refresh token à chaque utilisation
  - Révocation : possible (logout, admin)
```

### 1.2 Politique de Mots de Passe
```
Longueur minimale : 8 caractères
Complexité : au moins 1 majuscule, 1 minuscule, 1 chiffre
Hashage : BCrypt, cost factor = 12
Historique : pas de réutilisation des 3 derniers mots de passe
Expiration : non (pas de rotation forcée)
```

### 1.3 Protection contre les Attaques
```
Brute Force:
  - Verrouillage après 5 tentatives échouées
  - Durée verrouillage : 30 minutes
  - Rate limiting : 10 tentatives/minute par IP sur /auth/login

Credential Stuffing:
  - Messages d'erreur génériques ("Identifiants invalides")
  - Délai artificiel de 200ms sur les réponses d'erreur
  - Monitoring des connexions depuis de nouvelles IPs
```

## 2. Autorisation (RBAC)

### 2.1 Matrice des Permissions

```
Endpoint                          ADMIN  SPONSOR  DIRECTOR  CHEF  MEMBER  OBSERVER
─────────────────────────────────────────────────────────────────────────────────────
POST   /auth/login                 ✅      ✅       ✅       ✅     ✅      ✅
POST   /auth/refresh               ✅      ✅       ✅       ✅     ✅      ✅

GET    /users                      ✅      ❌       ❌       ❌     ❌      ❌
POST   /users                      ✅      ❌       ❌       ❌     ❌      ❌
GET    /users/me                   ✅      ✅       ✅       ✅     ✅      ✅

GET    /projects                   ✅*     ✅*      ✅*      ✅*    ✅*     ✅*
POST   /projects                   ❌      ❌       ✅       ❌     ❌      ❌
PUT    /projects/{id}              ❌      ❌       ✅       ✅     ❌      ❌
DELETE /projects/{id}              ❌      ❌       ✅       ❌     ❌      ❌

POST   /projects/{id}/modules      ❌      ❌       ✅       ❌     ❌      ❌
POST   /projects/{id}/actions      ❌      ❌       ✅       ✅     ❌      ❌
PATCH  /actions/{id}/progress      ❌      ❌       ✅       ✅     ✅      ❌
PATCH  /actions/{id}/block         ❌      ❌       ✅       ✅     ✅      ❌

POST   /indicators/{id}/values     ❌      ❌       ❌       ✅     ❌      ❌

GET    /projects/{id}/meteo        ❌      ✅       ✅       ✅     ✅      ✅
GET    /projects/{id}/projections  ❌      ✅       ✅       ✅     ❌      ❌

POST   /exports/pdf                ❌      ❌       ✅       ✅     ❌      ❌

GET    /admin/audit-log            ✅      ❌       ❌       ❌     ❌      ❌
```
*filtré par projets accessibles

### 2.2 Implémentation Spring Security
```java
// Niveau global (SecurityConfig)
.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
.anyRequest().authenticated()

// Niveau méthode (annotation custom)
@RequiresProjectRole({Role.CHEF})
public void recordIndicatorValue(...)

// Filtre automatique des projets par rôle
@Query("SELECT p FROM Project p JOIN UserProjectRole upr ON ...")
List<Project> findAccessibleProjects(UUID userId);
```

## 3. Protection des Données

### 3.1 Données Sensibles
| Donnée | Protection |
|--------|-----------|
| Mots de passe | BCrypt hash, jamais en clair |
| Tokens JWT | Mémoire uniquement, pas de persistance côté client |
| Refresh tokens | Hashés en base, révocables |
| Données projet | Filtrage par rôle, pas d'accès croisé |
| Logs d'audit | IP masquée partiellement en affichage |

### 3.2 Validation des Entrées
```java
// Toutes les entrées utilisateur sont validées via Jakarta Validation
public record CreateProjectRequest(
    @NotBlank @Size(max = 255) String name,
    @NotBlank @Size(max = 20) @Pattern(regexp = "^[A-Z]{3}-\\d{3}$") String code,
    @NotNull @Future LocalDate startDate,
    @NotNull @Future LocalDate endDate,
    @NotNull @DecimalMin("0") BigDecimal budgetTotal,
    @NotNull ProjectType type,
    @NotNull Criticality criticality
) {}
```

### 3.3 Protection SQL Injection
```
✅ JPA Parameterized Queries (systématique)
✅ @Query avec :paramName (pas de concaténation)
❌ Interdit : "SELECT * FROM x WHERE id = '" + id + "'"
```

### 3.4 Protection XSS
```
Frontend Angular:
  ✅ Sanitization automatique par Angular
  ✅ Pas d'utilisation de innerHTML avec contenu user
  ✅ CSP headers configurés

Backend:
  ✅ Réponses JSON (pas de HTML rendu côté serveur)
  ✅ Content-Type: application/json
```

## 4. Protection API

### 4.1 Rate Limiting
```yaml
Endpoints publics (/auth/login):
  - 10 requêtes/minute par IP
  - Header: X-RateLimit-Remaining

Endpoints authentifiés:
  - 100 requêtes/minute par utilisateur
  - 429 Too Many Requests en cas de dépassement

Endpoints lourds (/projections, /exports):
  - 10 requêtes/minute par utilisateur
```

### 4.2 CORS
```java
@Bean
CorsConfigurationSource corsConfigSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:4200")); // Production: domaine spécifique
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    // ...
}
```

### 4.3 Headers de Sécurité
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

## 5. Audit Trail

### 5.1 Actions Auditées
| Action | Entité | Données enregistrées |
|--------|--------|---------------------|
| LOGIN | User | email, IP, user-agent, succès/échec |
| LOGOUT | User | email, IP |
| CREATE | Project, Action, Risk, etc. | Données créées |
| UPDATE | Project, Action, Indicator, etc. | Anciennes + nouvelles valeurs |
| DELETE | Action, Module | Données supprimées |
| CALCULATE | Météo, CQD | Score calculé, règles appliquées |
| EXPORT | Report | Type export, sections |

### 5.2 Format Audit Log
```json
{
  "id": "uuid",
  "userId": "uuid",
  "projectId": "uuid",
  "action": "UPDATE",
  "entityType": "ACTION",
  "entityId": "uuid",
  "oldValues": { "progress": 50, "status": "IN_PROGRESS" },
  "newValues": { "progress": 75, "status": "IN_PROGRESS" },
  "description": "Mise à jour avancement action 'Dev API Users'",
  "ipAddress": "192.168.1.x",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2026-04-11T10:30:00Z"
}
```

## 6. Configuration Sécurisée

### 6.1 Variables d'Environnement (secrets externalisés)
```
DB_USERNAME=meteo
DB_PASSWORD=<secret>
JWT_SECRET=<256-bit random key>
REDIS_HOST=localhost
CORS_ORIGINS=https://meteo-project.example.com
```

### 6.2 Fichiers à exclure du VCS
```gitignore
# Secrets
.env
.env.local
*.pem
*.key

# Credentials
application-local.yml
application-prod.yml
```

## 7. Checklist Sécurité par Sprint

```
□ Tous les endpoints sont protégés par JWT
□ Les rôles RBAC sont vérifiés sur chaque endpoint sensible
□ Les inputs sont validés (Jakarta Validation)
□ Pas de SQL injection possible (JPA parameterized)
□ Pas de données sensibles dans les logs
□ Rate limiting actif sur les endpoints concernés
□ Audit log enregistre les actions sensibles
□ Les tests de sécurité passent
```
